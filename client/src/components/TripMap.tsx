import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalLink,
  Navigation,
  Calendar,
  UtensilsCrossed,
  Compass,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Info,
  X,
  Layers,
  ChevronRight,
} from "lucide-react";
import { MapView } from "@/components/Map";
import type { Destination } from "@/data/destinations";
import { foodPlaces, getFoodPlacesForDestination } from "@/data/foodPlaces";
import { Button } from "@/components/ui/button";
import type { ItineraryDay, ItineraryStop } from "@/contexts/TripContext";
import type { AccommodationSelection } from "@/data/accommodations";
import {
  buildExploreDestinationMapUrl,
  buildItineraryDayDirectionsUrl,
  buildSinglePlaceDirectionsUrl,
  type DirectionsStopCandidate,
} from "@/lib/mapsDirections";

export type ItineraryWaypoint = {
  title: string;
  location: string;
  description: string;
  duration: string;
  stopType?: "attraction" | "food";
  specialties?: string[];
  coords?: { lat: number; lng: number };
};

export type MappedPoint = {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: string;
  coords: { lat: number; lng: number };
  stopNumber: number;
  isFood: boolean;
  specialties?: string[];
  dayNumber?: number;
};

export type MapCluster = {
  id: string;
  isCluster: true;
  points: MappedPoint[];
  coords: { lat: number; lng: number };
  attractionCount: number;
  foodCount: number;
  totalCount: number;
};

export function TripMap({
  destination,
  itineraryStops,
  days,
  accommodation,
}: {
  destination: Destination;
  itineraryStops?: ItineraryWaypoint[];
  days?: ItineraryDay[];
  accommodation?: AccommodationSelection | null;
}) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(
    days && days.length > 0 ? 0 : null
  );

  // Sync selected day when days array changes
  useEffect(() => {
    if (days && days.length > 0) {
      setSelectedDayIndex(prev =>
        prev !== null && prev >= 0 && prev < days.length ? prev : 0
      );
    } else {
      setSelectedDayIndex(null);
    }
  }, [days]);
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);
  const [directoryFilter, setDirectoryFilter] = useState<"all" | "attractions" | "food">("all");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panCenter, setPanCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Check whether this view represents a genuine, ordered itinerary
  const isOrderedItinerary = Boolean(
    (days && days.length > 0) || (itineraryStops && itineraryStops.length > 0)
  );

  // Helper to resolve coordinates for a stop
  const resolveStopCoords = useCallback(
    (stop: ItineraryWaypoint | ItineraryStop, index: number): { coords: { lat: number; lng: number }; isFood: boolean } => {
      if (
        stop.coords &&
        typeof stop.coords.lat === "number" &&
        typeof stop.coords.lng === "number" &&
        (stop.coords.lat !== 0 || stop.coords.lng !== 0)
      ) {
        return {
          coords: stop.coords,
          isFood: stop.stopType === "food" || stop.location.toLowerCase().includes("food spot"),
        };
      }

      const matchedAttraction = destination.points.find(
        p =>
          p.name.toLowerCase() === stop.title.toLowerCase() ||
          stop.title.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(stop.title.toLowerCase())
      );
      if (matchedAttraction) {
        return { coords: matchedAttraction.coords, isFood: false };
      }

      const matchedFood = foodPlaces.find(
        f =>
          f.name.toLowerCase() === stop.title.toLowerCase() ||
          stop.title.toLowerCase().includes(f.name.toLowerCase()) ||
          f.name.toLowerCase().includes(stop.title.toLowerCase())
      );
      if (matchedFood) {
        return { coords: matchedFood.coords, isFood: true };
      }

      const anchor = destination.points[index % Math.max(1, destination.points.length)] ?? { coords: destination.coords };
      const offset = (Math.floor(index / Math.max(1, destination.points.length)) + 1) * 0.005;
      return {
        coords: { lat: anchor.coords.lat + offset, lng: anchor.coords.lng - offset },
        isFood: stop.stopType === "food",
      };
    },
    [destination]
  );

  // Computed points based on selected day or all days
  const activePoints = useMemo<MappedPoint[]>(() => {
    if (days && days.length > 0) {
      if (selectedDayIndex !== null && days[selectedDayIndex]) {
        const currentDay = days[selectedDayIndex];
        return currentDay.stops.map((stop, sIdx) => {
          const { coords, isFood } = resolveStopCoords(stop, sIdx);
          return {
            id: `day-${currentDay.day}-stop-${sIdx}`,
            name: stop.title,
            description: `${stop.location} · ${stop.description}`,
            category: isFood ? "Restaurant" : "Attraction",
            duration: stop.duration,
            coords,
            stopNumber: sIdx + 1,
            isFood,
            specialties: stop.specialties,
            dayNumber: currentDay.day,
          };
        });
      }

      let globalIdx = 0;
      return days.flatMap(day =>
        day.stops.map(stop => {
          globalIdx++;
          const { coords, isFood } = resolveStopCoords(stop, globalIdx);
          return {
            id: `day-${day.day}-stop-${globalIdx}`,
            name: `Day ${day.day}: ${stop.title}`,
            description: `${stop.location} · ${stop.description}`,
            category: isFood ? "Restaurant" : "Attraction",
            duration: stop.duration,
            coords,
            stopNumber: globalIdx,
            isFood,
            specialties: stop.specialties,
            dayNumber: day.day,
          };
        })
      );
    }

    if (itineraryStops?.length) {
      return itineraryStops.map((stop, index) => {
        const { coords, isFood } = resolveStopCoords(stop, index);
        return {
          id: `itinerary-${index}`,
          name: stop.title,
          description: `${stop.location} · ${stop.description}`,
          category: isFood ? "Restaurant" : "Attraction",
          duration: stop.duration,
          coords,
          stopNumber: index + 1,
          isFood,
          specialties: stop.specialties,
        };
      });
    }

    // Default destination atlas guide (no trip stops yet)
    const destinationFoods = getFoodPlacesForDestination(destination.id).map((f, i) => ({
      id: f.id,
      name: f.name,
      description: f.famousFor,
      category: f.category || "Restaurant",
      duration: "90 minutes",
      coords: f.coords,
      stopNumber: destination.points.length + i + 1,
      isFood: true,
      specialties: f.specialties,
    }));

    const attractions = destination.points.map((p, i) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      duration: p.duration,
      coords: p.coords,
      stopNumber: i + 1,
      isFood: false,
    }));

    return [...attractions, ...destinationFoods];
  }, [days, selectedDayIndex, itineraryStops, destination, resolveStopCoords]);

  // Clears previous markers and routes from Google Maps
  const clearMapOverlays = useCallback(() => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
  }, []);

  // Render markers and route onto Google Maps instance when active
  const renderMapContent = useCallback(
    (map: google.maps.Map) => {
      clearMapOverlays();
      if (activePoints.length === 0) return;

      const bounds = new google.maps.LatLngBounds();

      activePoints.forEach(point => {
        const isFood = point.isFood;
        const marker = new google.maps.Marker({
          map,
          position: point.coords,
          title: point.name,
          label: {
            text: String(point.stopNumber),
            color: "#ffffff",
            fontWeight: "bold",
            fontSize: "12px",
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 13,
            fillColor: isFood ? "#d97706" : "#0d7a68",
            fillOpacity: 1,
            strokeColor: isFood ? "#fef3c7" : "#ccfbf1",
            strokeWeight: 2,
          },
        });

        markersRef.current.push(marker);

        const badgeLabel = isFood
          ? `🍴 Stop ${point.stopNumber} · Famous Local Food Spot`
          : `📍 Stop ${point.stopNumber} · ${point.category}`;

        const info = new google.maps.InfoWindow({
          content: `<div style="color:#092426;padding:6px 10px;max-width:260px;font-family:system-ui,-apple-system,sans-serif">
            <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:${isFood ? "#d97706" : "#0d7a68"};letter-spacing:0.5px">${badgeLabel}</span>
            <strong style="display:block;margin:4px 0 2px;font-size:14px;color:#0f172a">${point.name}</strong>
            <p style="margin:4px 0 0;font-size:12px;line-height:1.4;color:#475569">${point.description}</p>
            <div style="margin-top:6px;font-size:11px;color:#64748b;display:flex;align-items:center;gap:4px">
              ⏱ Duration: ${point.duration}
            </div>
          </div>`,
        });

        marker.addListener("click", () => info.open({ map, anchor: marker }));
        bounds.extend(point.coords);
      });

      // Hotel marker (only for genuine ordered itineraries with valid accommodation)
      if (
        isOrderedItinerary &&
        accommodation?.coords &&
        typeof accommodation.coords.lat === "number" &&
        typeof accommodation.coords.lng === "number" &&
        accommodation.coords.lat !== 0
      ) {
        const hotelMarker = new google.maps.Marker({
          map,
          position: accommodation.coords,
          title: `🏨 Hotel: ${accommodation.name}`,
          label: {
            text: "🏨",
            fontSize: "13px",
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: "#4f46e5",
            fillOpacity: 1,
            strokeColor: "#c7d2fe",
            strokeWeight: 2,
          },
        });
        markersRef.current.push(hotelMarker);
        bounds.extend(accommodation.coords);
      }

      // Draw polyline route only if it is a genuine, ordered itinerary and not a multi-day overview
      if (
        isOrderedItinerary &&
        activePoints.length > 1 &&
        (selectedDayIndex !== null || !days || days.length <= 1)
      ) {
        const line = new google.maps.Polyline({
          path: activePoints.map(p => p.coords),
          geodesic: true,
          strokeColor: "#2dd4bf",
          strokeOpacity: 0.85,
          strokeWeight: 4,
          map,
        });
        polylineRef.current = line;
      }

      if (activePoints.length === 1) {
        map.setCenter(activePoints[0].coords);
        map.setZoom(13);
      } else if (activePoints.length > 1) {
        map.fitBounds(bounds, 52);
      } else if (activePoints.length === 0 && destination?.coords) {
        map.setCenter(destination.coords);
        map.setZoom(11);
      }
    },
    [activePoints, clearMapOverlays, accommodation, destination, isOrderedItinerary, selectedDayIndex, days]
  );

  const setupMap = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      renderMapContent(map);
    },
    [renderMapContent]
  );

  useEffect(() => {
    if (mapRef.current) {
      renderMapContent(mapRef.current);
    }
  }, [renderMapContent]);

  // Construct Google Maps directions URL
  const directionsUrl = useMemo(() => {
    // 1. Explore page discovery mode: center map on destination without routes or waypoints
    if (!isOrderedItinerary) {
      return buildExploreDestinationMapUrl(destination.coords, destination.name);
    }

    // 2. Trip itinerary with day tabs: route ONLY the selected day's ordered stops
    if (days && days.length > 0) {
      const targetDayIndex =
        selectedDayIndex !== null && days[selectedDayIndex] ? selectedDayIndex : 0;
      const targetDay = days[targetDayIndex];
      const targetStops: DirectionsStopCandidate[] = targetDay.stops.map((stop, sIdx) => {
        const { coords, isFood } = resolveStopCoords(stop, sIdx);
        return {
          title: stop.title,
          coords,
          isFood,
        };
      });

      return buildItineraryDayDirectionsUrl(targetStops, destination.coords);
    }

    // 3. Flat itinerary stops (if provided)
    if (itineraryStops && itineraryStops.length > 0) {
      const resolved = itineraryStops.map((stop, idx) => {
        const { coords, isFood } = resolveStopCoords(stop, idx);
        return {
          title: stop.title,
          coords,
          isFood,
        };
      });
      return buildItineraryDayDirectionsUrl(resolved, destination.coords);
    }

    return buildExploreDestinationMapUrl(destination.coords, destination.name);
  }, [isOrderedItinerary, days, selectedDayIndex, itineraryStops, destination, resolveStopCoords]);

  const hasDaysFilter = Boolean(days && days.length > 1);

  // Spatial coordinates calculation for fallback canvas
  const spatialBounds = useMemo(() => {
    const allCoords = activePoints.map(p => p.coords).concat([destination.coords]);
    if (isOrderedItinerary && accommodation?.coords) allCoords.push(accommodation.coords);

    const lats = allCoords.map(c => c.lat);
    const lngs = allCoords.map(c => c.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const spanLat = Math.max(maxLat - minLat, 0.04);
    const spanLng = Math.max(maxLng - minLng, 0.04);

    const padLat = spanLat * 0.16;
    const padLng = spanLng * 0.16;

    return {
      minLat: minLat - padLat,
      maxLat: maxLat + padLat,
      minLng: minLng - padLng,
      maxLng: maxLng + padLng,
      centerLat: (minLat + maxLat) / 2,
      centerLng: (minLng + maxLng) / 2,
    };
  }, [activePoints, destination.coords, accommodation]);

  // Project geographic coordinates into SVG percentage coordinates
  const getPositionPercent = useCallback(
    (coords: { lat: number; lng: number }) => {
      const { minLat, maxLat, minLng, maxLng, centerLat, centerLng } = spatialBounds;
      const activeCenter = panCenter || { lat: centerLat, lng: centerLng };

      const spanLat = maxLat - minLat;
      const spanLng = maxLng - minLng;

      const normDx = (coords.lng - activeCenter.lng) / spanLng;
      const normDy = (activeCenter.lat - coords.lat) / spanLat;

      const x = 50 + normDx * 100 * zoomLevel;
      const y = 50 + normDy * 100 * zoomLevel;

      return {
        x: Math.max(-10, Math.min(110, x)),
        y: Math.max(-10, Math.min(110, y)),
        isOffscreen: x < -5 || x > 105 || y < -5 || y > 105,
      };
    },
    [spatialBounds, panCenter, zoomLevel]
  );

  // Selected point detail
  const selectedPoint = useMemo(() => {
    return activePoints.find(p => p.id === activePointId) || null;
  }, [activePoints, activePointId]);

  // Selected cluster detail
  const selectedCluster = useMemo(() => {
    if (!activeClusterId) return null;
    return activePoints.filter(p => p.id === activeClusterId);
  }, [activePoints, activeClusterId]);

  const attractionCount = useMemo(() => activePoints.filter(p => !p.isFood).length, [activePoints]);
  const foodCount = useMemo(() => activePoints.filter(p => p.isFood).length, [activePoints]);

  const filteredDirectoryPoints = useMemo(() => {
    if (directoryFilter === "attractions") return activePoints.filter(p => !p.isFood);
    if (directoryFilter === "food") return activePoints.filter(p => p.isFood);
    return activePoints;
  }, [activePoints, directoryFilter]);

  // Zoom-aware Marker Clustering Algorithm
  // Prevents overlapping by grouping nearby markers into clusters at current zoom level
  const displayedItems = useMemo<(MappedPoint | MapCluster)[]>(() => {
    // If it is an ordered itinerary with few stops, do not cluster so order is obvious
    if (isOrderedItinerary && activePoints.length <= 8) {
      return activePoints;
    }

    // Cluster threshold radius in canvas percentage units
    // At zoom 1: ~7.5% radius. At zoom 2+: smaller radius to unpack naturally
    const thresholdRadius = 8.5 / Math.max(1, Math.sqrt(zoomLevel));
    const clusters: { points: MappedPoint[]; center: { lat: number; lng: number }; x: number; y: number }[] = [];

    activePoints.forEach(point => {
      const pos = getPositionPercent(point.coords);

      let foundCluster = false;
      for (const cl of clusters) {
        const dx = cl.x - pos.x;
        const dy = cl.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < thresholdRadius) {
          cl.points.push(point);
          const count = cl.points.length;
          cl.center = {
            lat: (cl.center.lat * (count - 1) + point.coords.lat) / count,
            lng: (cl.center.lng * (count - 1) + point.coords.lng) / count,
          };
          const updatedPos = getPositionPercent(cl.center);
          cl.x = updatedPos.x;
          cl.y = updatedPos.y;
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        clusters.push({
          points: [point],
          center: { ...point.coords },
          x: pos.x,
          y: pos.y,
        });
      }
    });

    const items: (MappedPoint | MapCluster)[] = [];

    clusters.forEach((cl, index) => {
      // If cluster has 1 point, render as standard individual marker
      if (cl.points.length === 1) {
        items.push(cl.points[0]);
        return;
      }

      // If cluster contains the actively selected point, unpack it so the selected marker is directly visible
      if (activePointId && cl.points.some(p => p.id === activePointId)) {
        cl.points.forEach((p, pIdx) => {
          // Slight fan-out offset if overlapping perfectly
          const angle = (pIdx / cl.points.length) * 2 * Math.PI;
          const offsetDist = 3.5;
          items.push({
            ...p,
            coords: {
              lat: p.coords.lat + (Math.sin(angle) * 0.003) / zoomLevel,
              lng: p.coords.lng + (Math.cos(angle) * 0.003) / zoomLevel,
            },
          });
        });
        return;
      }

      const clusterAttractions = cl.points.filter(p => !p.isFood).length;
      const clusterFoods = cl.points.filter(p => p.isFood).length;

      items.push({
        id: `cluster-${index}-${cl.points[0].id}`,
        isCluster: true,
        points: cl.points,
        coords: cl.center,
        attractionCount: clusterAttractions,
        foodCount: clusterFoods,
        totalCount: cl.points.length,
      });
    });

    return items;
  }, [activePoints, getPositionPercent, zoomLevel, isOrderedItinerary, activePointId]);

  // Click cluster: zoom into cluster area & center
  const handleClusterClick = (cluster: MapCluster) => {
    setActiveClusterId(cluster.id);
    setActivePointId(null);
    setPanCenter(cluster.coords);
    setZoomLevel(prev => Math.min(2.8, prev + 0.65));
  };

  // Click place in directory: highlight marker, center and zoom in if necessary
  const handleDirectoryPointClick = (point: MappedPoint) => {
    setActivePointId(point.id);
    setActiveClusterId(null);
    setPanCenter(point.coords);
    if (zoomLevel < 1.4) {
      setZoomLevel(1.6);
    }
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanCenter(null);
    setActivePointId(null);
    setActiveClusterId(null);
    setHoveredPointId(null);
  };

  return (
    <section className="map-shell">
      {/* Top Toolbar */}
      <div className="map-toolbar">
        <div>
          <p className="eyebrow">Spatial itinerary & route map</p>
          <h3>
            {destination.name},{" "}
            {isOrderedItinerary && days && selectedDayIndex !== null && days[selectedDayIndex]
              ? `Day ${days[selectedDayIndex].day} Route`
              : isOrderedItinerary && days && selectedDayIndex === null
              ? "All Days overview"
              : "mapped"}
          </h3>
        </div>
        <div className="map-actions">
          <a href={directionsUrl} target="_blank" rel="noreferrer">
            <Button className="button-teal">
              {isOrderedItinerary && days && days.length > 0 ? (
                <>
                  <Navigation size={15} /> Open Day {days[selectedDayIndex !== null && days[selectedDayIndex] ? selectedDayIndex : 0].day} route in Google Maps
                </>
              ) : (
                <>
                  <ExternalLink size={15} /> Open directions
                </>
              )}
            </Button>
          </a>
        </div>
      </div>

      {/* Day Filter Pills */}
      {hasDaysFilter && (
        <div
          className="map-day-selector"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            padding: "12px 18px",
            background: "rgba(5, 23, 33, 0.7)",
            borderBottom: "1px solid rgba(45, 212, 191, 0.15)",
          }}
        >
          <span style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "5px" }}>
            <Calendar size={13} /> Filter day:
          </span>
          <button
            type="button"
            onClick={() => setSelectedDayIndex(null)}
            style={{
              padding: "4px 12px",
              borderRadius: "16px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: selectedDayIndex === null ? "#0d7a68" : "rgba(255, 255, 255, 0.06)",
              color: selectedDayIndex === null ? "#ffffff" : "#a5c9c6",
              border: selectedDayIndex === null ? "1px solid #2dd4bf" : "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            All Days ({days?.reduce((sum, d) => sum + d.stops.length, 0)} stops)
          </button>
          {days?.map((day, idx) => (
            <button
              type="button"
              key={day.day}
              onClick={() => setSelectedDayIndex(idx)}
              style={{
                padding: "4px 12px",
                borderRadius: "16px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: selectedDayIndex === idx ? "#0d7a68" : "rgba(255, 255, 255, 0.06)",
                color: selectedDayIndex === idx ? "#ffffff" : "#a5c9c6",
                border: selectedDayIndex === idx ? "1px solid #2dd4bf" : "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              Day {day.day}
              {day.formattedDailyDistance ? ` (${day.formattedDailyDistance})` : ""}
            </button>
          ))}
        </div>
      )}

      {/* Map Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "8px 18px",
          background: "rgba(5, 23, 33, 0.55)",
          fontSize: "11px",
          color: "#94a3b8",
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#0d7a68",
              border: "1px solid #2dd4bf",
              display: "inline-block",
            }}
          />
          Sightseeing Attractions ({attractionCount})
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#d97706",
              border: "1px solid #fde68a",
              display: "inline-block",
            }}
          />
          Famous Local Food Spots ({foodCount})
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0d7a68 50%, #d97706 50%)",
              border: "1px solid #5eead4",
              display: "inline-block",
            }}
          />
          Clustered Area (click to zoom)
        </span>
        {isOrderedItinerary && accommodation && (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#4f46e5",
                border: "1px solid #c7d2fe",
                display: "inline-block",
              }}
            />
            Selected Hotel
          </span>
        )}
        <span style={{ marginLeft: "auto", color: "#5eead4", fontWeight: 500, display: "flex", alignItems: "center", gap: "5px" }}>
          <Compass size={13} /> {activePoints.length} total mapped locations
        </span>
      </div>

      {/* Map Frame: Live Google Maps or Interactive Spatial Field Map */}
      <div className="trip-map-frame" style={{ position: "relative", minHeight: "450px", background: "#051821" }}>
        {!mapUnavailable ? (
          <MapView
            className="trip-map"
            initialCenter={destination.coords}
            initialZoom={11}
            onMapReady={setupMap}
            onMapError={() => setMapUnavailable(true)}
          />
        ) : (
          /* HIGH-FIDELITY SPATIAL FIELD MAP FALLBACK */
          <div
            className="spatial-field-map"
            style={{
              position: "relative",
              width: "100%",
              height: "450px",
              background: "radial-gradient(ellipse at 50% 50%, #082631 0%, #03141b 100%)",
              overflow: "hidden",
              userSelect: "none",
            }}
          >
            {/* SVG Coordinate Grid & Radial Rings */}
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              <defs>
                <pattern id="spatial-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(45, 212, 191, 0.08)" strokeWidth="1" />
                </pattern>
                <radialGradient id="radar-pulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.12" />
                  <stop offset="70%" stopColor="#0d7a68" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#03141b" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Grid Background */}
              <rect width="100%" height="100%" fill="url(#spatial-grid)" />

              {/* Concentric Distance Rings from Center */}
              {(() => {
                const centerPos = getPositionPercent(destination.coords);
                return (
                  <g opacity="0.6">
                    <circle cx={`${centerPos.x}%`} cy={`${centerPos.y}%`} r={`${65 * zoomLevel}`} fill="url(#radar-pulse)" stroke="rgba(45, 212, 191, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx={`${centerPos.x}%`} cy={`${centerPos.y}%`} r={`${130 * zoomLevel}`} fill="none" stroke="rgba(45, 212, 191, 0.18)" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx={`${centerPos.x}%`} cy={`${centerPos.y}%`} r={`${195 * zoomLevel}`} fill="none" stroke="rgba(45, 212, 191, 0.12)" strokeWidth="1" strokeDasharray="6 6" />
                    <text x={`${centerPos.x + 3}%`} y={`${centerPos.y - 10}%`} fill="#5eead4" fontSize="9" fontFamily="monospace" opacity="0.7">~5 km radius</text>
                  </g>
                );
              })()}

              {/* Connecting Route Lines ONLY when this is a genuine, ordered itinerary for a selected day */}
              {isOrderedItinerary &&
                activePoints.length > 1 &&
                (selectedDayIndex !== null || !days || days.length <= 1) && (
                <polyline
                  points={activePoints
                    .map(p => {
                      const pos = getPositionPercent(p.coords);
                      return `${pos.x * 4.5},${pos.y * 4.5}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                  strokeOpacity="0.65"
                />
              )}
            </svg>

            {/* Destination Hub Indicator */}
            {(() => {
              const centerPos = getPositionPercent(destination.coords);
              if (centerPos.isOffscreen) return null;

              return (
                <div
                  style={{
                    position: "absolute",
                    left: `${centerPos.x}%`,
                    top: `${centerPos.y}%`,
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                    zIndex: 2,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "rgba(94, 234, 212, 0.35)",
                      border: "1.5px solid #5eead4",
                      boxShadow: "0 0 14px rgba(45, 212, 191, 0.7)",
                      margin: "0 auto",
                    }}
                  />
                  <span
                    style={{
                      display: "block",
                      marginTop: "3px",
                      fontSize: "9px",
                      fontWeight: 600,
                      color: "#99f6e4",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      background: "rgba(3, 20, 27, 0.85)",
                      padding: "1px 5px",
                      borderRadius: "4px",
                      border: "1px solid rgba(45, 212, 191, 0.2)",
                    }}
                  >
                    {destination.name} Hub
                  </span>
                </div>
              );
            })()}

            {/* Mapped Markers and Clusters */}
            {displayedItems.map(item => {
              const pos = getPositionPercent(item.coords);
              if (pos.isOffscreen) return null;

              // RENDER CLUSTER
              if ("isCluster" in item && item.isCluster) {
                const cluster = item as MapCluster;
                const isSelectedCluster = activeClusterId === cluster.id;
                const hasOnlyAttractions = cluster.foodCount === 0;
                const hasOnlyFoods = cluster.attractionCount === 0;

                const clusterBg = hasOnlyAttractions
                  ? "#0d7a68"
                  : hasOnlyFoods
                  ? "#d97706"
                  : "linear-gradient(135deg, #0d7a68 50%, #d97706 50%)";

                const clusterBorder = isSelectedCluster
                  ? "3px solid #ffffff"
                  : hasOnlyAttractions
                  ? "2px solid #5eead4"
                  : hasOnlyFoods
                  ? "2px solid #fde68a"
                  : "2px solid #5eead4";

                return (
                  <div
                    key={cluster.id}
                    onClick={() => handleClusterClick(cluster)}
                    style={{
                      position: "absolute",
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: isSelectedCluster ? "translate(-50%, -50%) scale(1.15)" : "translate(-50%, -50%)",
                      zIndex: isSelectedCluster ? 35 : 20,
                      cursor: "pointer",
                      transition: "transform 0.18s ease",
                    }}
                    title={`Cluster: ${cluster.totalCount} places (${cluster.attractionCount} attractions, ${cluster.foodCount} eateries). Click to zoom.`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") handleClusterClick(cluster);
                    }}
                  >
                    {/* Clustered Badge */}
                    <div
                      style={{
                        padding: "4px 10px",
                        minHeight: "30px",
                        borderRadius: "20px",
                        background: clusterBg,
                        border: clusterBorder,
                        boxShadow: isSelectedCluster
                          ? "0 0 22px rgba(45, 212, 191, 0.9)"
                          : "0 4px 14px rgba(0, 0, 0, 0.55)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        fontWeight: 800,
                        fontFamily: "monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Layers size={13} />
                      {hasOnlyAttractions && <span>🏛️ {cluster.totalCount}</span>}
                      {hasOnlyFoods && <span>🍴 {cluster.totalCount}</span>}
                      {!hasOnlyAttractions && !hasOnlyFoods && (
                        <span>
                          🏛️{cluster.attractionCount} · 🍴{cluster.foodCount}
                        </span>
                      )}
                    </div>

                    {/* Small hint label */}
                    <span
                      style={{
                        display: "block",
                        marginTop: "2px",
                        fontSize: "9px",
                        fontWeight: 600,
                        color: "#e2e8f0",
                        background: "rgba(3, 20, 27, 0.85)",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        textAlign: "center",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                      }}
                    >
                      {cluster.totalCount} places (click to zoom)
                    </span>
                  </div>
                );
              }

              // RENDER INDIVIDUAL POINT
              const point = item as MappedPoint;
              const isSelected = activePointId === point.id;
              const isHovered = hoveredPointId === point.id;
              const isFood = point.isFood;

              return (
                <div
                  key={point.id}
                  onClick={() => {
                    setActivePointId(isSelected ? null : point.id);
                    setActiveClusterId(null);
                  }}
                  onMouseEnter={() => setHoveredPointId(point.id)}
                  onMouseLeave={() => setHoveredPointId(null)}
                  style={{
                    position: "absolute",
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: isSelected ? "translate(-50%, -50%) scale(1.2)" : "translate(-50%, -50%)",
                    zIndex: isSelected ? 40 : isHovered ? 30 : 10,
                    cursor: "pointer",
                    transition: "transform 0.16s ease",
                  }}
                  title={`${point.name} (${isFood ? "Food spot" : "Attraction"})`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActivePointId(isSelected ? null : point.id);
                    }
                  }}
                >
                  {/* Circular Marker Badge */}
                  <div
                    style={{
                      width: isSelected ? "32px" : "26px",
                      height: isSelected ? "32px" : "26px",
                      borderRadius: "50%",
                      background: isFood ? "#d97706" : "#0d7a68",
                      border: isSelected
                        ? "3px solid #ffffff"
                        : isFood
                        ? "2px solid #fef3c7"
                        : "2px solid #5eead4",
                      boxShadow: isSelected
                        ? isFood
                          ? "0 0 20px rgba(245, 158, 11, 0.9)"
                          : "0 0 20px rgba(45, 212, 191, 0.9)"
                        : "0 4px 10px rgba(0, 0, 0, 0.45)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isSelected ? "13px" : "11px",
                      fontWeight: 800,
                      fontFamily: "monospace",
                    }}
                  >
                    {point.stopNumber}
                  </div>

                  {/* Marker Pinpoint Shadow Tip */}
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      background: isFood ? "#d97706" : "#0d7a68",
                      transform: "rotate(45deg)",
                      margin: "-3px auto 0",
                      borderRadius: "1px",
                    }}
                  />

                  {/* Hover Tooltip or Selected Label */}
                  {(isHovered || isSelected || zoomLevel >= 1.6) && (
                    <span
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        marginTop: "2px",
                        fontSize: isSelected ? "10px" : "9px",
                        fontWeight: isSelected ? 700 : 600,
                        color: isSelected ? "#ffffff" : isFood ? "#fef3c7" : "#ccfbf1",
                        background: isSelected ? "rgba(13, 148, 136, 0.95)" : "rgba(3, 20, 27, 0.9)",
                        padding: "2px 7px",
                        borderRadius: "4px",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        maxWidth: isSelected ? "180px" : "120px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        boxShadow: "0 3px 8px rgba(0,0,0,0.5)",
                        border: isSelected ? "1px solid #5eead4" : "1px solid rgba(255, 255, 255, 0.15)",
                        zIndex: 45,
                        pointerEvents: "none",
                      }}
                    >
                      {point.name.replace(" (Famous Local Food Spot)", "")}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Hotel Reference Marker (only when viewing an ordered itinerary with selected accommodation) */}
            {isOrderedItinerary &&
              accommodation?.coords &&
              typeof accommodation.coords.lat === "number" &&
              typeof accommodation.coords.lng === "number" &&
              accommodation.coords.lat !== 0 && (() => {
                const hotelPos = getPositionPercent(accommodation.coords);
                return (
                  <div
                    style={{
                      position: "absolute",
                      left: `${hotelPos.x}%`,
                      top: `${hotelPos.y}%`,
                      transform: "translate(-50%, -50%)",
                      zIndex: 35,
                      cursor: "default",
                    }}
                    title={`🏨 Selected Hotel: ${accommodation.name}`}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#4f46e5",
                        border: "2px solid #c7d2fe",
                        boxShadow: "0 0 14px rgba(79, 70, 229, 0.75)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                      }}
                    >
                      🏨
                    </div>
                  </div>
                );
              })()}

            {/* Selected Marker Detail Card / Tooltip */}
            {selectedPoint && (
              <div
                style={{
                  position: "absolute",
                  left: "16px",
                  bottom: "16px",
                  maxWidth: "340px",
                  background: "rgba(5, 23, 33, 0.95)",
                  border: "1px solid rgba(94, 234, 212, 0.4)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  boxShadow: "0 14px 34px rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(12px)",
                  zIndex: 50,
                  color: "#e2e8f0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: selectedPoint.isFood ? "#fbbf24" : "#5eead4",
                      background: selectedPoint.isFood ? "rgba(217, 119, 6, 0.2)" : "rgba(13, 122, 104, 0.2)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: `1px solid ${selectedPoint.isFood ? "rgba(217, 119, 6, 0.4)" : "rgba(45, 212, 191, 0.4)"}`,
                    }}
                  >
                    Stop {selectedPoint.stopNumber} · {selectedPoint.isFood ? "Famous Local Food Spot" : selectedPoint.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActivePointId(null)}
                    style={{
                      background: "transparent",
                      border: 0,
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: "2px",
                      display: "flex",
                    }}
                    aria-label="Close details"
                  >
                    <X size={14} />
                  </button>
                </div>

                <h4 style={{ margin: "8px 0 4px", fontSize: "15px", color: "#f8fafc", fontWeight: 600 }}>
                  {selectedPoint.name}
                </h4>
                <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#94a3b8", lineHeight: "1.45" }}>
                  {selectedPoint.description}
                </p>

                {selectedPoint.specialties && selectedPoint.specialties.length > 0 && (
                  <div style={{ margin: "6px 0", fontSize: "11px", color: "#fde68a" }}>
                    <UtensilsCrossed size={11} style={{ display: "inline", marginRight: "4px" }} />
                    Specialties: {selectedPoint.specialties.join(", ")}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", fontSize: "10px", color: "#64748b" }}>
                  <span>
                    📍 {selectedPoint.coords.lat.toFixed(4)}° N, {selectedPoint.coords.lng.toFixed(4)}° E
                  </span>
                  <a
                    href={buildSinglePlaceDirectionsUrl(selectedPoint.coords)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "#5eead4",
                      textDecoration: "none",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    Directions <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            )}

            {/* Selected Cluster Detail List Popover */}
            {activeClusterId && (
              (() => {
                const cluster = displayedItems.find(
                  it => "isCluster" in it && it.id === activeClusterId
                ) as MapCluster | undefined;
                if (!cluster) return null;

                return (
                  <div
                    style={{
                      position: "absolute",
                      left: "16px",
                      bottom: "16px",
                      maxWidth: "340px",
                      maxHeight: "220px",
                      overflowY: "auto",
                      background: "rgba(5, 23, 33, 0.95)",
                      border: "1px solid rgba(94, 234, 212, 0.4)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      boxShadow: "0 14px 34px rgba(0, 0, 0, 0.6)",
                      backdropFilter: "blur(12px)",
                      zIndex: 50,
                      color: "#e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#5eead4" }}>
                        Cluster: {cluster.totalCount} Places
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveClusterId(null)}
                        style={{ background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer", padding: "2px" }}
                        aria-label="Close cluster list"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <p style={{ margin: "0 0 10px", fontSize: "11px", color: "#94a3b8" }}>
                      Click any place to zoom and view its details:
                    </p>

                    <div style={{ display: "grid", gap: "6px" }}>
                      {cluster.points.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            handleDirectoryPointClick(p);
                            setActiveClusterId(null);
                          }}
                          style={{
                            padding: "6px 8px",
                            borderRadius: "6px",
                            background: "rgba(255, 255, 255, 0.05)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            fontSize: "11px",
                          }}
                        >
                          <span
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              background: p.isFood ? "#d97706" : "#0d7a68",
                              display: "grid",
                              placeItems: "center",
                              color: "#fff",
                              fontSize: "9px",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {p.stopNumber}
                          </span>
                          <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#f1f5f9" }}>
                            {p.name.replace(" (Famous Local Food Spot)", "")}
                          </span>
                          <ChevronRight size={13} style={{ color: "#5eead4", flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}

            {/* Compass Indicator in Top-Right */}
            <div
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                background: "rgba(5, 23, 33, 0.75)",
                border: "1px solid rgba(45, 212, 191, 0.2)",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#5eead4",
                fontSize: "8px",
                fontFamily: "monospace",
                zIndex: 15,
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              }}
              title="Orientation: North Up"
            >
              <span style={{ color: "#f87171", fontWeight: 700, fontSize: "9px", lineHeight: "1" }}>▲ N</span>
              <span style={{ color: "#64748b", fontSize: "7px", lineHeight: "1" }}>S</span>
            </div>

            {/* Map Canvas Zoom / Pan Controls */}
            <div
              style={{
                position: "absolute",
                top: "14px",
                left: "14px",
                display: "flex",
                gap: "5px",
                zIndex: 15,
              }}
            >
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.35))}
                style={{
                  background: "rgba(5, 23, 33, 0.8)",
                  border: "1px solid rgba(45, 212, 191, 0.25)",
                  color: "#5eead4",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.35))}
                style={{
                  background: "rgba(5, 23, 33, 0.8)",
                  border: "1px solid rgba(45, 212, 191, 0.25)",
                  color: "#5eead4",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                onClick={handleResetView}
                style={{
                  background: "rgba(5, 23, 33, 0.8)",
                  border: "1px solid rgba(45, 212, 191, 0.25)",
                  color: "#5eead4",
                  height: "28px",
                  padding: "0 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                }}
                title="Reset view"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {/* Bottom Status Info */}
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                right: "12px",
                background: "rgba(5, 23, 33, 0.85)",
                border: "1px solid rgba(45, 212, 191, 0.2)",
                padding: "4px 9px",
                borderRadius: "6px",
                fontSize: "10px",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                zIndex: 15,
              }}
            >
              <Info size={12} style={{ color: "#2dd4bf" }} />
              <span>Interactive Spatial Field Map · Click cluster to zoom, click marker for details</span>
            </div>
          </div>
        )}
      </div>

      {/* Useful Destination Attractions & Food Spots Directory (Always available) */}
      <div
        className="destination-places-directory"
        style={{
          background: "rgba(4, 21, 29, 0.95)",
          borderTop: "1px solid rgba(45, 212, 191, 0.16)",
          padding: "16px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={15} style={{ color: "#2dd4bf" }} />
            <h4 style={{ margin: 0, color: "#f0fdfa", fontSize: "14px", fontWeight: 600 }}>
              Mapped Places & Local Flavours in {destination.name} ({activePoints.length})
            </h4>
          </div>

          {/* Directory Filter Chips */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={() => setDirectoryFilter("all")}
              style={{
                padding: "3px 10px",
                borderRadius: "14px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                background: directoryFilter === "all" ? "rgba(45, 212, 191, 0.2)" : "transparent",
                color: directoryFilter === "all" ? "#5eead4" : "#94a3b8",
                border: directoryFilter === "all" ? "1px solid #2dd4bf" : "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              All ({activePoints.length})
            </button>
            <button
              type="button"
              onClick={() => setDirectoryFilter("attractions")}
              style={{
                padding: "3px 10px",
                borderRadius: "14px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                background: directoryFilter === "attractions" ? "rgba(13, 122, 104, 0.3)" : "transparent",
                color: directoryFilter === "attractions" ? "#5eead4" : "#94a3b8",
                border: directoryFilter === "attractions" ? "1px solid #2dd4bf" : "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              Sightseeing ({attractionCount})
            </button>
            <button
              type="button"
              onClick={() => setDirectoryFilter("food")}
              style={{
                padding: "3px 10px",
                borderRadius: "14px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                background: directoryFilter === "food" ? "rgba(217, 119, 6, 0.3)" : "transparent",
                color: directoryFilter === "food" ? "#fde68a" : "#94a3b8",
                border: directoryFilter === "food" ? "1px solid #d97706" : "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              Local Food ({foodCount})
            </button>
          </div>
        </div>

        {/* Scrollable Grid of All Destination Places */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "10px",
            maxHeight: "260px",
            overflowY: "auto",
            paddingRight: "5px",
            scrollbarWidth: "thin",
          }}
        >
          {filteredDirectoryPoints.map(point => {
            const isSelected = activePointId === point.id;
            const isFood = point.isFood;

            return (
              <div
                key={point.id}
                onClick={() => handleDirectoryPointClick(point)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: isSelected ? "rgba(15, 60, 72, 0.85)" : "rgba(8, 35, 45, 0.5)",
                  border: isSelected
                    ? isFood
                      ? "1px solid #f59e0b"
                      : "1px solid #2dd4bf"
                    : "1px solid rgba(45, 212, 191, 0.1)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                {/* Number Badge */}
                <span
                  style={{
                    flexShrink: 0,
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: isFood ? "#d97706" : "#0d7a68",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 700,
                    fontFamily: "monospace",
                    display: "grid",
                    placeItems: "center",
                    border: isFood ? "1px solid #fde68a" : "1px solid #5eead4",
                    marginTop: "2px",
                  }}
                >
                  {point.stopNumber}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "6px" }}>
                    <strong
                      style={{
                        fontSize: "12px",
                        color: "#f8fafc",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {point.name.replace(" (Famous Local Food Spot)", "")}
                    </strong>
                    <small style={{ fontSize: "10px", color: isFood ? "#fde68a" : "#5eead4", flexShrink: 0 }}>
                      {point.duration}
                    </small>
                  </div>

                  <p
                    style={{
                      margin: "3px 0 4px",
                      fontSize: "10px",
                      color: "#94a3b8",
                      lineHeight: "1.4",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {point.description}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "9px", color: "#64748b", fontFamily: "monospace" }}>
                      {point.coords.lat.toFixed(3)}°N, {point.coords.lng.toFixed(3)}°E
                    </span>
                    <a
                      href={buildSinglePlaceDirectionsUrl(point.coords)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        fontSize: "10px",
                        color: isFood ? "#fde68a" : "#5eead4",
                        textDecoration: "none",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                      }}
                    >
                      Directions <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
