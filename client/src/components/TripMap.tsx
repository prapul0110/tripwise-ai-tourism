import { useCallback, useMemo, useRef, useState } from "react";
import { ExternalLink, Navigation } from "lucide-react";
import { MapView } from "@/components/Map";
import type { Destination, PointOfInterest } from "@/data/destinations";
import { Button } from "@/components/ui/button";

type ItineraryWaypoint = { title: string; location: string; description: string; duration: string };

export function TripMap({ destination, itineraryStops }: { destination: Destination; itineraryStops?: ItineraryWaypoint[] }) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const points = useMemo<PointOfInterest[]>(() => itineraryStops?.length ? itineraryStops.map((stop, index) => {
    const anchor = destination.points[index % destination.points.length] ?? { coords: destination.coords };
    const offset = (Math.floor(index / destination.points.length) + 1) * 0.004;
    return { id: `itinerary-${index}`, name: stop.title, description: `${stop.location} · ${stop.description}`, category: "Activity", planningCost: 0, duration: stop.duration, coords: { lat: anchor.coords.lat + offset, lng: anchor.coords.lng - offset } };
  }) : destination.points, [destination, itineraryStops]);
  const setupMap = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    const bounds = new google.maps.LatLngBounds();
    points.forEach(point => {
      const marker = new google.maps.Marker({ map, position: point.coords, title: point.name });
      const info = new google.maps.InfoWindow({ content: `<div style="color:#092426;padding:4px 8px;max-width:210px"><strong>${point.name}</strong><p style="margin:6px 0 0">${point.description}</p></div>` });
      marker.addListener("click", () => info.open({ map, anchor: marker }));
      bounds.extend(point.coords);
    });
    if (points.length > 1) map.fitBounds(bounds, 58);
  }, [points]);
  const showRoute = () => {
    if (!mapRef.current || points.length < 2) { window.open(directionsUrl, "_blank", "noopener,noreferrer"); return; }
    const service = new google.maps.DirectionsService();
    const renderer = new google.maps.DirectionsRenderer({ map: mapRef.current, suppressMarkers: true, polylineOptions: { strokeColor: "#35d5c7", strokeOpacity: 0.85, strokeWeight: 4 } });
    service.route({ origin: points[0].coords, destination: points[points.length - 1].coords, waypoints: points.slice(1, -1).map(point => ({ location: point.coords, stopover: true })), travelMode: google.maps.TravelMode.DRIVING }, (result, status) => { if (status === "OK" && result) renderer.setDirections(result); });
  };
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.coords.lat},${destination.coords.lng}`;
  return <section className="map-shell"><div className="map-toolbar"><div><p className="eyebrow">Spatial itinerary</p><h3>{destination.name}, mapped</h3></div><div className="map-actions"><Button variant="outline" className="button-outline" onClick={showRoute}><Navigation size={15} /> Route stops</Button><a href={directionsUrl} target="_blank" rel="noreferrer"><Button className="button-teal"><ExternalLink size={15} /> Open directions</Button></a></div></div><div className="trip-map-frame"><MapView className="trip-map" initialCenter={destination.coords} initialZoom={11} onMapReady={setupMap} onMapError={() => setMapUnavailable(true)} />{mapUnavailable && <div className="map-fallback"><p className="eyebrow">Map preview unavailable</p><p>Use directions to open this route in Google Maps.</p><a href={directionsUrl} target="_blank" rel="noreferrer">Open directions <ExternalLink size={14} /></a></div>}</div></section>;
}
