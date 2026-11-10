import { describe, it, expect } from "vitest";
import {
  getAvailableStopsForDestination,
  getScheduledStopTitles,
  type StopCandidate,
} from "../client/src/lib/destinationStops";
import {
  recalculateDaySchedule,
  ensureStopId,
  generateStableStopId,
  type ItineraryDay,
  type ItineraryStop,
} from "../shared/routeRecalculation";

describe("Stage 2 Manual Itinerary Editing - Add Stop & Recalculation", () => {
  it("1. Loads catalogue attractions and food places for a destination and separates them", () => {
    const { destination, attractions, foodPlaces, allCandidates } =
      getAvailableStopsForDestination("Goa", []);

    expect(destination.name).toBe("Goa");
    expect(attractions.length).toBeGreaterThan(0);
    expect(foodPlaces.length).toBeGreaterThan(0);
    expect(allCandidates.length).toBe(attractions.length + foodPlaces.length);

    // Verify properties
    const attraction = attractions[0]!;
    expect(attraction.stopType).toBe("attraction");
    expect(attraction.coords).toBeDefined();
    expect(attraction.coords.lat).toBeGreaterThan(0);

    const food = foodPlaces[0]!;
    expect(food.stopType).toBe("food");
    expect(food.coords).toBeDefined();
    expect(Array.isArray(food.specialties)).toBe(true);
  });

  it("2. Filters out stops that are already scheduled anywhere in the itinerary (cross-day duplicate prevention)", () => {
    const existingItinerary: ItineraryDay[] = [
      {
        day: 1,
        title: "North Goa",
        theme: "Beaches",
        stops: [
          {
            id: "stop-1",
            title: "Baga Beach",
            time: "09:30",
            duration: "2 hours",
            location: "Goa",
            description: "Beach",
            estimatedCost: 0,
            stopType: "attraction",
          },
          {
            id: "stop-2",
            title: "Vinayak Family Restaurant",
            time: "12:15",
            duration: "90 minutes",
            location: "Assagao, Goa",
            description: "Goan Fish Thali",
            estimatedCost: 500,
            stopType: "food",
          },
        ],
      },
      {
        day: 2,
        title: "South Goa",
        theme: "Heritage",
        stops: [
          {
            id: "stop-3",
            title: "Fort Aguada",
            time: "09:30",
            duration: "2 hours",
            location: "Goa",
            description: "Fortress",
            estimatedCost: 100,
            stopType: "attraction",
          },
        ],
      },
    ];

    const scheduled = getScheduledStopTitles(existingItinerary);
    expect(scheduled.has("baga beach")).toBe(true);
    expect(scheduled.has("vinayak family restaurant")).toBe(true);
    expect(scheduled.has("fort aguada")).toBe(true);

    const { allCandidates } = getAvailableStopsForDestination("Goa", existingItinerary);
    // Baga Beach, Vinayak, and Fort Aguada must NOT appear in available candidates
    expect(allCandidates.some(c => c.title.toLowerCase() === "baga beach")).toBe(false);
    expect(allCandidates.some(c => c.title.toLowerCase() === "vinayak family restaurant")).toBe(false);
    expect(allCandidates.some(c => c.title.toLowerCase() === "fort aguada")).toBe(false);
  });

  it("3. Adds an attraction to a day and recalculates transit and timing", () => {
    const day: ItineraryDay = {
      day: 1,
      title: "Jaipur Sightseeing",
      theme: "Forts",
      stops: [
        {
          id: "stop-amer",
          title: "Amer Fort Palace",
          time: "09:30",
          duration: "2 hours",
          location: "Jaipur",
          description: "Historic fort",
          estimatedCost: 500,
          coords: { lat: 26.9855, lng: 75.8513 },
        },
      ],
    };

    const newAttractionCandidate: StopCandidate = {
      id: "jaigarh",
      title: "Jaigarh Fort & Jaivana Cannon",
      category: "Attraction",
      stopType: "attraction",
      location: "Jaipur, Rajasthan",
      description: "Massive medieval fort housing the world's largest wheeled cannon.",
      duration: "2 hours",
      estimatedCost: 300,
      coords: { lat: 26.9850, lng: 75.8456 },
      source: "catalogue_attraction",
    };

    const newStop: ItineraryStop = {
      id: generateStableStopId(1, newAttractionCandidate.title, day.stops.length),
      time: "15:00",
      title: newAttractionCandidate.title,
      location: newAttractionCandidate.location,
      description: newAttractionCandidate.description,
      duration: newAttractionCandidate.duration,
      estimatedCost: newAttractionCandidate.estimatedCost,
      stopType: newAttractionCandidate.stopType,
      coords: newAttractionCandidate.coords,
    };

    const recalculated = recalculateDaySchedule({
      ...day,
      stops: [...day.stops, newStop],
    });

    expect(recalculated.stops.length).toBe(2);
    expect(recalculated.stops[1].title).toBe("Jaigarh Fort & Jaivana Cannon");
    expect(recalculated.stops[1].coords).toEqual({ lat: 26.9850, lng: 75.8456 });
    expect(recalculated.stops[0].transitToNext).toBeDefined();
    expect(recalculated.totalDistanceKm).toBeGreaterThan(0);
    expect(recalculated.totalTransitMinutes).toBeGreaterThan(0);
  });

  it("4. Adds a food stop and sets correct stopType, timing, and specialties", () => {
    const day: ItineraryDay = {
      day: 1,
      title: "Jaipur Culinary Trail",
      theme: "Heritage & Food",
      stops: [
        {
          id: "stop-amer",
          title: "Amer Fort Palace",
          time: "09:30",
          duration: "2 hours",
          location: "Jaipur",
          description: "Historic fort",
          estimatedCost: 500,
          coords: { lat: 26.9855, lng: 75.8513 },
        },
      ],
    };

    const foodCandidate: StopCandidate = {
      id: "jaipur-lmb",
      title: "Laxmi Mishthan Bhandar (LMB)",
      category: "Lunch",
      stopType: "food",
      location: "Johari Bazaar, Jaipur",
      description: "Legendary Johari Bazaar sweet shop and vegetarian restaurant.",
      duration: "90 minutes · Lunch",
      estimatedCost: 800,
      specialties: ["Rajasthani Royal Thali", "Paneer Ghewar", "Pyaz Ki Kachori"],
      coords: { lat: 26.9208, lng: 75.8248 },
      source: "catalogue_food",
    };

    const newStop: ItineraryStop = {
      id: generateStableStopId(1, foodCandidate.title, day.stops.length),
      time: "12:15",
      title: foodCandidate.title,
      location: foodCandidate.location,
      description: foodCandidate.description,
      duration: foodCandidate.duration,
      estimatedCost: foodCandidate.estimatedCost,
      stopType: foodCandidate.stopType,
      specialties: foodCandidate.specialties,
      coords: foodCandidate.coords,
    };

    const recalculated = recalculateDaySchedule({
      ...day,
      stops: [...day.stops, newStop],
    });

    expect(recalculated.stops.length).toBe(2);
    expect(recalculated.stops[1].title).toBe("Laxmi Mishthan Bhandar (LMB)");
    expect(recalculated.stops[1].stopType).toBe("food");
    expect(recalculated.stops[1].specialties).toContain("Rajasthani Royal Thali");
    // Stop 1 ends at 11:30, transit is ~23 mins + 10m buffer -> earliest ~12:03, lunch slot is 12:15
    expect(recalculated.stops[1].time).toBe("12:15");
  });

  it("5. Adds a stop to an empty day and initializes start time properly", () => {
    const emptyDay: ItineraryDay = {
      day: 3,
      title: "Free Day",
      theme: "Leisure",
      stops: [],
    };

    const attractionCandidate: StopCandidate = {
      id: "hawa-mahal",
      title: "Hawa Mahal Palace of Winds",
      category: "Attraction",
      stopType: "attraction",
      location: "Jaipur, Rajasthan",
      description: "Iconic five-story pink honeycomb facade.",
      duration: "1 hour",
      estimatedCost: 200,
      coords: { lat: 26.9239, lng: 75.8267 },
      source: "catalogue_attraction",
    };

    const newStop: ItineraryStop = {
      id: generateStableStopId(3, attractionCandidate.title, 0),
      time: "09:30",
      title: attractionCandidate.title,
      location: attractionCandidate.location,
      description: attractionCandidate.description,
      duration: attractionCandidate.duration,
      estimatedCost: attractionCandidate.estimatedCost,
      stopType: attractionCandidate.stopType,
      coords: attractionCandidate.coords,
    };

    const recalculated = recalculateDaySchedule({
      ...emptyDay,
      stops: [newStop],
    });

    expect(recalculated.stops.length).toBe(1);
    expect(recalculated.stops[0].title).toBe("Hawa Mahal Palace of Winds");
    expect(recalculated.stops[0].time).toBe("09:30");
    expect(recalculated.stops[0].transitToNext).toBeUndefined();
    expect(recalculated.totalDistanceKm).toBe(0);
    expect(recalculated.totalTransitMinutes).toBe(0);
  });

  it("6. Preserves Move Up, Move Down, and Remove after adding stops", () => {
    const day: ItineraryDay = {
      day: 1,
      title: "Hyderabad Day",
      theme: "City Trail",
      stops: [
        {
          id: "stop-charminar",
          title: "Charminar & Laad Bazaar",
          time: "09:30",
          duration: "2 hours",
          location: "Hyderabad",
          description: "Monument",
          estimatedCost: 100,
          coords: { lat: 17.3616, lng: 78.4747 },
        },
        {
          id: "stop-shadab",
          title: "Hotel Shadab",
          time: "12:15",
          duration: "90 minutes",
          location: "Hyderabad",
          description: "Biryani",
          estimatedCost: 600,
          coords: { lat: 17.3685, lng: 78.4735 },
        },
      ],
    };

    // Add 3rd stop (Chowmahalla Palace)
    const newStop: ItineraryStop = {
      id: generateStableStopId(1, "Chowmahalla Palace", 2),
      time: "15:00",
      title: "Chowmahalla Palace",
      location: "Hyderabad",
      description: "Opulent seat of the Nizams",
      duration: "2 hours",
      estimatedCost: 150,
      coords: { lat: 17.3578, lng: 78.4718 },
    };

    let updatedDay = recalculateDaySchedule({
      ...day,
      stops: [...day.stops, newStop],
    });
    expect(updatedDay.stops.length).toBe(3);

    // Test Move Up (move 3rd stop up to 2nd position)
    const reorderedStops = [updatedDay.stops[0]!, updatedDay.stops[2]!, updatedDay.stops[1]!];
    updatedDay = recalculateDaySchedule({
      ...updatedDay,
      stops: reorderedStops,
    });
    expect(updatedDay.stops[1].title).toBe("Chowmahalla Palace");
    expect(updatedDay.stops[2].title).toBe("Hotel Shadab");

    // Test Remove (remove Hotel Shadab)
    const withoutShadab = updatedDay.stops.filter(s => s.title !== "Hotel Shadab");
    updatedDay = recalculateDaySchedule({
      ...updatedDay,
      stops: withoutShadab,
    });
    expect(updatedDay.stops.length).toBe(2);
    expect(updatedDay.stops[0].title).toBe("Charminar & Laad Bazaar");
    expect(updatedDay.stops[1].title).toBe("Chowmahalla Palace");
  });

  it("7. Handles destinations with incomplete catalogue data gracefully", () => {
    // Test with an unusual or small destination
    const result = getAvailableStopsForDestination("NonExistentDest1234", []);
    expect(result.destination).toBeDefined();
    // Doesn't throw error and returns valid arrays
    expect(Array.isArray(result.attractions)).toBe(true);
    expect(Array.isArray(result.foodPlaces)).toBe(true);
    expect(Array.isArray(result.allCandidates)).toBe(true);
  });
});
