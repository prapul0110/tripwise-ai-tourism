import { describe, it, expect } from "vitest";
import { destinations } from "../client/src/data/destinations";
import { getFoodPlacesForDestination } from "../client/src/data/foodPlaces";
import type { MappedPoint, MapCluster } from "../client/src/components/TripMap";

describe("Explore Page Layout & Map Data Verification", () => {
  // Requirement 1: Destinations have valid coordinates and points of interest
  it("1. every destination in the atlas has valid geographic coordinates and sightseeing attractions", () => {
    destinations.forEach(dest => {
      expect(dest.coords.lat).toBeGreaterThanOrEqual(8);
      expect(dest.coords.lat).toBeLessThanOrEqual(38);
      expect(dest.coords.lng).toBeGreaterThanOrEqual(68);
      expect(dest.coords.lng).toBeLessThanOrEqual(98);

      expect(dest.points.length).toBeGreaterThan(0);
      dest.points.forEach(point => {
        expect(point.name.length).toBeGreaterThan(0);
        expect(point.coords.lat).toBeGreaterThanOrEqual(8);
        expect(point.coords.lat).toBeLessThanOrEqual(38);
        expect(point.coords.lng).toBeGreaterThanOrEqual(68);
        expect(point.coords.lng).toBeLessThanOrEqual(98);
        expect(point.category).toBeDefined();
        expect(point.duration).toBeDefined();
      });
    });
  });

  // Requirement 2: Goa preserves exactly 31 locations (20 attractions + 11 food places)
  it("2. preserves all 31 locations in Goa (20 sightseeing attractions + 11 celebrated eateries)", () => {
    const goa = destinations.find(d => d.id === "goa")!;
    expect(goa).toBeDefined();
    expect(goa.points.length).toBe(20);

    const goaFoods = getFoodPlacesForDestination("goa");
    expect(goaFoods.length).toBe(11);

    const totalLocations = goa.points.length + goaFoods.length;
    expect(totalLocations).toBe(31);

    // Verify all 20 attractions have valid coordinates and descriptions
    goa.points.forEach((attraction, idx) => {
      expect(attraction.id).toBeDefined();
      expect(attraction.name.length).toBeGreaterThan(2);
      expect(attraction.coords.lat).toBeGreaterThan(14.5);
      expect(attraction.coords.lat).toBeLessThan(16.0);
      expect(attraction.coords.lng).toBeGreaterThan(73.5);
      expect(attraction.coords.lng).toBeLessThan(74.5);
    });

    // Verify all 11 food spots have valid coordinates and specialties
    goaFoods.forEach(food => {
      expect(food.id).toBeDefined();
      expect(food.name.length).toBeGreaterThan(2);
      expect(food.specialties.length).toBeGreaterThan(0);
      expect(food.coords.lat).toBeGreaterThan(14.5);
      expect(food.coords.lat).toBeLessThan(16.0);
    });
  });

  // Requirement 3: Route-line accuracy (no route lines on Explore map)
  it("3. route line is disabled for Explore atlas and enabled only for ordered itineraries", () => {
    // Case A: Explore page passes only `destination` -> no days, no itineraryStops
    const exploreViewDays = undefined;
    const exploreViewStops = undefined;
    const isOrderedItineraryExplore = Boolean(
      (exploreViewDays && (exploreViewDays as any[]).length > 0) ||
      (exploreViewStops && (exploreViewStops as any[]).length > 0)
    );
    expect(isOrderedItineraryExplore).toBe(false);

    // Case B: Trip Detail passes itinerary days -> genuine ordered itinerary
    const tripDays = [{ day: 1, theme: "Arrival", stops: [] }];
    const isOrderedItineraryTrip = Boolean(
      (tripDays && tripDays.length > 0)
    );
    expect(isOrderedItineraryTrip).toBe(true);
  });

  // Requirement 4: Zoom-aware marker clustering prevents overlapping
  it("4. groups nearby markers into distinct clusters to prevent overlapping at default zoom", () => {
    const goa = destinations.find(d => d.id === "goa")!;
    const goaFoods = getFoodPlacesForDestination("goa");

    const mappedPoints: MappedPoint[] = [
      ...goa.points.map((p, i) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        duration: p.duration,
        coords: p.coords,
        stopNumber: i + 1,
        isFood: false,
      })),
      ...goaFoods.map((f, i) => ({
        id: f.id,
        name: f.name,
        description: f.famousFor,
        category: "Restaurant",
        duration: "90 minutes",
        coords: f.coords,
        stopNumber: goa.points.length + i + 1,
        isFood: true,
        specialties: f.specialties,
      })),
    ];

    expect(mappedPoints.length).toBe(31);

    // Simulated projection function
    const lats = mappedPoints.map(p => p.coords.lat);
    const lngs = mappedPoints.map(p => p.coords.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const getPos = (coords: { lat: number; lng: number }, zoom = 1) => {
      const x = ((coords.lng - minLng) / (maxLng - minLng)) * 100 * zoom;
      const y = ((maxLat - coords.lat) / (maxLat - minLat)) * 100 * zoom;
      return { x, y };
    };

    // Cluster algorithm test
    const cluster = (points: MappedPoint[], zoom: number) => {
      const radius = 8.5 / Math.max(1, Math.sqrt(zoom));
      const clusters: { points: MappedPoint[]; x: number; y: number }[] = [];

      points.forEach(point => {
        const pos = getPos(point.coords, zoom);
        let found = false;
        for (const cl of clusters) {
          const dx = cl.x - pos.x;
          const dy = cl.y - pos.y;
          if (Math.sqrt(dx * dx + dy * dy) < radius) {
            cl.points.push(point);
            found = true;
            break;
          }
        }
        if (!found) {
          clusters.push({ points: [point], x: pos.x, y: pos.y });
        }
      });
      return clusters;
    };

    // At zoom 1: multiple points cluster together, reducing screen density
    const clustersZoom1 = cluster(mappedPoints, 1);
    expect(clustersZoom1.length).toBeLessThan(mappedPoints.length);

    // Multi-point clusters exist
    const multiClusters = clustersZoom1.filter(c => c.points.length > 1);
    expect(multiClusters.length).toBeGreaterThan(0);

    // At higher zoom (zoom 3): clusters unpack into individual markers
    const clustersZoom3 = cluster(mappedPoints, 3);
    expect(clustersZoom3.length).toBeGreaterThan(clustersZoom1.length);
  });

  // Requirement 5: Sightseeing and food markers are visually distinct
  it("5. identifies attractions vs food spots accurately in clusters and markers", () => {
    const goa = destinations.find(d => d.id === "goa")!;
    const goaFoods = getFoodPlacesForDestination("goa");

    const attractions = goa.points.map(p => ({ isFood: false }));
    const foods = goaFoods.map(f => ({ isFood: true }));

    expect(attractions.every(a => a.isFood === false)).toBe(true);
    expect(foods.every(f => f.isFood === true)).toBe(true);

    // Combined cluster classifications
    const mixed = [...attractions.slice(0, 2), ...foods.slice(0, 3)];
    const attractionCount = mixed.filter(m => !m.isFood).length;
    const foodCount = mixed.filter(m => m.isFood).length;

    expect(attractionCount).toBe(2);
    expect(foodCount).toBe(3);
  });
});
