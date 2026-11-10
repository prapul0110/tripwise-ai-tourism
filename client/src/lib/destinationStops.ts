import { getDestination, type Destination, type PointOfInterest } from "../data/destinations";
import { getFoodPlacesForDestination, type FoodPlace } from "../data/foodPlaces";
import type { ItineraryDay } from "../contexts/TripContext";

export type StopCandidate = {
  id: string;
  title: string;
  category: string;
  stopType: "attraction" | "food";
  mealType?: "breakfast" | "lunch" | "dinner";
  location: string;
  description: string;
  duration: string;
  estimatedCost: number;
  specialties?: string[];
  coords: { lat: number; lng: number };
  priceRange?: string;
  source: "catalogue_attraction" | "catalogue_food" | "custom";
};

/**
 * Returns a normalized lowercase set of all stop titles currently scheduled
 * anywhere across the entire trip itinerary to prevent cross-day duplicates.
 */
export function getScheduledStopTitles(itinerary: ItineraryDay[] = []): Set<string> {
  const set = new Set<string>();
  for (const day of itinerary) {
    if (!day.stops) continue;
    for (const stop of day.stops) {
      if (stop.title) {
        set.add(stop.title.toLowerCase().trim());
      }
    }
  }
  return set;
}

/**
 * Retrieves all available unscheduled attractions and food places for a destination,
 * combining points of interest from destinations.ts, indiaCatalogue.ts, and foodPlaces.ts.
 * Deduplicates by title and strictly excludes stops already present in the itinerary.
 */
export function getAvailableStopsForDestination(
  destinationQuery: string,
  itinerary: ItineraryDay[] = []
): {
  destination: Destination;
  attractions: StopCandidate[];
  foodPlaces: StopCandidate[];
  allCandidates: StopCandidate[];
  totalCatalogueCount: number;
  scheduledCount: number;
} {
  const destination = getDestination(destinationQuery);
  const scheduledTitles = getScheduledStopTitles(itinerary);

  const seenTitles = new Set<string>();
  const foodCandidates: StopCandidate[] = [];
  const attractionCandidates: StopCandidate[] = [];

  let totalCatalogueCount = 0;

  // 1. Food Places from foodPlaces.ts
  const rawFood = getFoodPlacesForDestination(destination.id);
  const fallbackFood = rawFood.length > 0 ? rawFood : getFoodPlacesForDestination(destination.name);

  for (const f of fallbackFood) {
    totalCatalogueCount++;
    const normTitle = f.name.toLowerCase().trim();
    if (scheduledTitles.has(normTitle) || seenTitles.has(normTitle)) continue;
    seenTitles.add(normTitle);

    const catLower = f.category.toLowerCase();
    const mealType: "breakfast" | "lunch" | "dinner" =
      catLower.includes("breakfast") || catLower.includes("café") || catLower.includes("bakery")
        ? "breakfast"
        : catLower.includes("dinner")
        ? "dinner"
        : "lunch";

    const cost = f.priceRange === "₹₹₹" ? 1500 : f.priceRange === "₹₹" ? 800 : 350;
    const dur =
      mealType === "dinner"
        ? "90 minutes · Dinner"
        : mealType === "breakfast"
        ? "45 minutes · Breakfast"
        : "90 minutes · Lunch";

    foodCandidates.push({
      id: f.id,
      title: f.name,
      category: f.category,
      stopType: "food",
      mealType,
      location: `${f.city || destination.name}`,
      description: f.description,
      duration: dur,
      estimatedCost: cost,
      specialties: f.specialties || [],
      coords: f.coords,
      priceRange: f.priceRange,
      source: "catalogue_food",
    });
  }

  // 2. Attractions & Points of Interest from destination.points
  const points = destination.points || [];
  for (const p of points) {
    totalCatalogueCount++;
    const normTitle = p.name.toLowerCase().trim();
    if (scheduledTitles.has(normTitle) || seenTitles.has(normTitle)) continue;
    seenTitles.add(normTitle);

    const isFood = p.category === "Restaurant";
    const candidate: StopCandidate = {
      id: p.id,
      title: p.name,
      category: p.category,
      stopType: isFood ? "food" : "attraction",
      location: `${destination.name}, ${destination.state}`,
      description: p.description,
      duration: p.duration || "90 minutes",
      estimatedCost: p.planningCost || 0,
      coords: p.coords,
      source: isFood ? "catalogue_food" : "catalogue_attraction",
    };

    if (isFood) {
      foodCandidates.push(candidate);
    } else {
      attractionCandidates.push(candidate);
    }
  }

  return {
    destination,
    attractions: attractionCandidates,
    foodPlaces: foodCandidates,
    allCandidates: [...attractionCandidates, ...foodCandidates],
    totalCatalogueCount,
    scheduledCount: scheduledTitles.size,
  };
}
