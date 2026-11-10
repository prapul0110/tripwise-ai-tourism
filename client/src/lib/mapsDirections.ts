/**
 * GOOGLE MAPS URL GENERATOR & ROUTING HELPERS - TRIPWISE AI
 *
 * Provides authoritative Google Maps URL generation adhering to the official
 * Google Maps URL Scheme:
 *
 * 1. Explore Page (Atlas discovery mode):
 *    - Opens Google Maps centered on the destination area (@?api=1&map_action=map&center=lat,lng&zoom=11)
 *    - Never sends all discovery POIs as waypoints
 *    - Never constructs a multi-stop driving route
 *    - Never includes hotel/accommodation markers
 *
 * 2. Individual Attractions & Food Places:
 *    - Opens Google Maps directions specifically to that single POI (dir/?api=1&destination=lat,lng)
 *
 * 3. Trip Detail Page (Itinerary execution mode):
 *    - Generates driving directions for the selected day's ordered stops
 *    - Respects the actual stop order (stop 1 as origin, stop N as destination, intermediate as waypoints)
 *    - Keeps separate days completely independent
 *    - Includes accommodation only when it is genuinely part of the day's itinerary stops
 */

export interface MapCoords {
  lat: number;
  lng: number;
}

export interface DirectionsStopCandidate {
  title?: string;
  name?: string;
  coords: MapCoords;
  isFood?: boolean;
}

/**
 * Builds Google Maps URL for Explore destination view.
 * Centers the map on the destination without routes or waypoints.
 */
export function buildExploreDestinationMapUrl(
  coords: MapCoords,
  _destinationName?: string
): string {
  const lat = coords?.lat ?? 15.4909;
  const lng = coords?.lng ?? 73.8278;
  return `https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lng}&zoom=11`;
}

/**
 * Builds Google Maps directions URL to a specific individual attraction or eatery.
 */
export function buildSinglePlaceDirectionsUrl(coords: MapCoords): string {
  const lat = coords?.lat ?? 0;
  const lng = coords?.lng ?? 0;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Builds Google Maps driving directions URL for a single itinerary day's ordered stops.
 * Excludes all stops from other days.
 */
export function buildItineraryDayDirectionsUrl(
  stops: DirectionsStopCandidate[],
  destinationCoords?: MapCoords
): string {
  const validStops = (stops || []).filter(
    s =>
      s &&
      s.coords &&
      typeof s.coords.lat === "number" &&
      typeof s.coords.lng === "number" &&
      !isNaN(s.coords.lat) &&
      !isNaN(s.coords.lng)
  );

  if (validStops.length >= 2) {
    const origin = validStops[0].coords;
    const dest = validStops[validStops.length - 1].coords;
    const intermediate = validStops.slice(1, -1);

    const waypointsParam =
      intermediate.length > 0
        ? `&waypoints=${intermediate.map(p => `${p.coords.lat},${p.coords.lng}`).join("%7C")}`
        : "";

    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}${waypointsParam}&travelmode=driving`;
  }

  if (validStops.length === 1) {
    return buildSinglePlaceDirectionsUrl(validStops[0].coords);
  }

  if (destinationCoords) {
    return buildExploreDestinationMapUrl(destinationCoords);
  }

  return "https://www.google.com/maps";
}
