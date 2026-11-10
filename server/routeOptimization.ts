import { ENV } from "./_core/env";
import { makeRequest, type DirectionsResult, type LatLng } from "./_core/map";

export type TransitInfo = {
  distanceKm: number;
  durationMinutes: number;
  formattedDistance: string;
  formattedDuration: string;
  source: "google_maps" | "estimate";
};

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates straight-line great-circle distance between two GPS coordinates using the Haversine formula.
 */
export function haversineDistanceKm(p1: LatLng, p2: LatLng): number {
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calibrated road transit estimation based on typical Indian urban and regional driving patterns.
 * - Detour winding factor: ~1.35x straight-line distance
 * - Average city/regional travel speed: ~28-32 km/h
 * - Minimum practical transit time between venues: 8 minutes
 */
export function estimateRoadTransit(p1: LatLng, p2: LatLng): TransitInfo {
  const straightKm = haversineDistanceKm(p1, p2);
  // Avoid 0 distance for co-located or very close venues
  const roadKm = Math.max(0.4, Math.round(straightKm * 1.35 * 10) / 10);
  const durationMinutes = Math.max(8, Math.round((roadKm / 28) * 60));

  const formattedDistance =
    roadKm < 1 ? `${Math.round(roadKm * 1000)} m (est.)` : `${roadKm.toFixed(1)} km (est.)`;

  const formattedDuration =
    durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60} mins (est.)`
      : `${durationMinutes} mins (est.)`;

  return {
    distanceKm: roadKm,
    durationMinutes,
    formattedDistance,
    formattedDuration,
    source: "estimate",
  };
}

// In-memory cache for Google Maps API requests to prevent redundant queries
const transitCache = new Map<string, TransitInfo>();

/**
 * Retrieves transit distance and duration between two coordinates.
 * Tries Google Maps Directions API via forge proxy if configured.
 * Falls back transparently and gracefully to calibrated road estimation.
 */
export async function getTransitBetween(
  p1: LatLng,
  p2: LatLng,
  options: { timeoutMs?: number } = {}
): Promise<TransitInfo> {
  const cacheKey = `${p1.lat.toFixed(4)},${p1.lng.toFixed(4)}->${p2.lat.toFixed(4)},${p2.lng.toFixed(4)}`;
  const cached = transitCache.get(cacheKey);
  if (cached) return cached;

  const hasCredentials = Boolean(ENV.forgeApiUrl && ENV.forgeApiKey);

  if (hasCredentials) {
    try {
      const timeoutMs = options.timeoutMs ?? 2500;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await Promise.race([
        makeRequest<DirectionsResult>("/maps/api/directions/json", {
          origin: `${p1.lat},${p1.lng}`,
          destination: `${p2.lat},${p2.lng}`,
          mode: "driving",
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Directions API request timed out")), timeoutMs)
        ),
      ]);
      clearTimeout(timer);

      if (res && res.routes && res.routes[0]?.legs?.[0]) {
        const leg = res.routes[0].legs[0];
        const distanceKm = Math.round((leg.distance.value / 1000) * 10) / 10;
        const durationMinutes = Math.max(5, Math.round(leg.duration.value / 60));

        const info: TransitInfo = {
          distanceKm,
          durationMinutes,
          formattedDistance: leg.distance.text,
          formattedDuration: leg.duration.text,
          source: "google_maps",
        };
        transitCache.set(cacheKey, info);
        return info;
      }
    } catch {
      // Graceful fallback on API error, rate limit, or timeout
    }
  }

  const fallback = estimateRoadTransit(p1, p2);
  transitCache.set(cacheKey, fallback);
  return fallback;
}
