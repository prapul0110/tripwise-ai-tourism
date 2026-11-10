/**
 * GOOGLE MAPS FRONTEND INTEGRATION - TRIPWISE AI
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const GOOGLE_MAPS_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  import.meta.env.VITE_FRONTEND_FORGE_API_KEY;

const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";

function getMapsScriptUrl(): string | null {
  if (!GOOGLE_MAPS_KEY || GOOGLE_MAPS_KEY === "undefined" || GOOGLE_MAPS_KEY.trim() === "") {
    return null;
  }
  if (import.meta.env.VITE_FRONTEND_FORGE_API_KEY && import.meta.env.VITE_FRONTEND_FORGE_API_URL) {
    return `${FORGE_BASE_URL}/v1/maps/proxy/maps/api/js?key=${GOOGLE_MAPS_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
  }
  return `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
}

let mapScriptPromise: Promise<void> | null = null;

function loadMapScript(): Promise<void> {
  if (typeof window !== "undefined" && window.google?.maps) return Promise.resolve();
  const scriptUrl = getMapsScriptUrl();
  if (!scriptUrl) {
    return Promise.reject(new Error("No Google Maps API credentials configured."));
  }
  if (mapScriptPromise) return mapScriptPromise;
  mapScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-tripwise-maps="true"]');
    const onLoad = () => (window.google?.maps ? resolve() : reject(new Error("Google Maps loaded without the expected API.")));
    const onError = () => reject(new Error("Google Maps could not be loaded."));
    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.dataset.tripwiseMaps = "true";
    script.crossOrigin = "anonymous";
    script.src = scriptUrl;
    script.async = true;
    script.onload = onLoad;
    script.onerror = onError;
    document.head.appendChild(script);
  }).catch(error => {
    mapScriptPromise = null;
    throw error;
  });
  return mapScriptPromise;
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
  onMapError?: () => void;
}

export function MapView({
  className,
  initialCenter = { lat: 15.4909, lng: 73.8278 },
  initialZoom = 11,
  onMapReady,
  onMapError,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [failed, setFailed] = useState(false);

  const init = usePersistFn(async () => {
    try {
      if (typeof window === "undefined") return;
      if (!window.google?.maps && !getMapsScriptUrl()) {
        throw new Error("No Google Maps API key provided. Switching to spatial field map.");
      }
      await loadMapScript();
      if (!mapContainer.current || !window.google?.maps) {
        throw new Error("Map container or API was unavailable.");
      }
      map.current = new window.google.maps.Map(mapContainer.current, {
        zoom: initialZoom,
        center: initialCenter,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
      });
      onMapReady?.(map.current);
    } catch (error) {
      setFailed(true);
      onMapError?.();
    }
  });

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div
      ref={mapContainer}
      className={cn("w-full h-[460px]", className)}
      aria-label={failed ? "Map preview fallback active" : "Interactive map"}
    />
  );
}
