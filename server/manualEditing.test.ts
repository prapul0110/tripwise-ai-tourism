import { describe, it, expect } from "vitest";
import {
  recalculateDaySchedule,
  ensureStopId,
  generateStableStopId,
  getStopMealType,
  type ItineraryDay,
  type ItineraryStop,
} from "../shared/routeRecalculation";

describe("Stage 1 Manual Itinerary Editing & Recalculation", () => {
  const sampleStops: ItineraryStop[] = [
    {
      title: "Amer Fort Palace",
      type: "sight",
      time: "09:30",
      description: "Magnificent amber sandstone fortress",
      location: "Amer, Jaipur",
      duration: "2 hours",
      cost: "₹550 per person",
      tips: "Take early electric carts",
      coordinates: { lat: 26.9855, lng: 75.8513 },
      transitFromPrev: undefined,
    },
    {
      title: "1135 AD Royal Dining",
      type: "food",
      time: "12:15",
      description: "Fine dining inside Amer Fort",
      location: "Amer Fort, Jaipur",
      duration: "90 minutes",
      mealType: "lunch",
      cost: "₹2,500 for two",
      coordinates: { lat: 26.9859, lng: 75.8507 },
      transitFromPrev: {
        distanceKm: 0.2,
        durationMinutes: 8,
        formattedDistance: "200 m (est.)",
        formattedDuration: "8 mins (est.)",
        isEstimate: true,
      },
    },
    {
      title: "Panna Meena Ka Kund Stepwell",
      type: "sight",
      time: "15:00",
      description: "16th-century geometric stepwell",
      location: "Amer, Jaipur",
      duration: "45 minutes",
      cost: "Free",
      coordinates: { lat: 26.9868, lng: 75.8538 },
      transitFromPrev: {
        distanceKm: 0.5,
        durationMinutes: 8,
        formattedDistance: "500 m (est.)",
        formattedDuration: "8 mins (est.)",
        isEstimate: true,
      },
    },
  ];

  it("1. Backward compatibility: generates stable IDs for trips without stop IDs", () => {
    const stopsWithoutId = sampleStops.map(s => ({ ...s, id: undefined }));
    const stopsWithId = stopsWithoutId.map((s, idx) => ensureStopId(s, 1, idx));

    expect(stopsWithId.every(s => typeof s.id === "string" && s.id.length > 0)).toBe(true);
    // Preserves existing ID if present
    const existingId = "stop-custom-123";
    const preserved = ensureStopId({ ...sampleStops[0], id: existingId }, 1, 0);
    expect(preserved.id).toBe(existingId);
  });

  it("2. Moving first stop down updates order and recomputes transit legs & arrival times", () => {
    // Original: [Amer Fort, 1135 AD, Panna Meena]
    // Move first stop down: [1135 AD, Amer Fort, Panna Meena]
    const reorderedStops = [sampleStops[1], sampleStops[0], sampleStops[2]];
    const day: ItineraryDay = {
      day: 1,
      title: "Jaipur Heritage",
      theme: "Royal Palaces",
      stops: reorderedStops,
    };

    const recalculated = recalculateDaySchedule(day);

    expect(recalculated.stops[0].title).toBe("1135 AD Royal Dining");
    expect(recalculated.stops[0].transitFromPrev).toBeUndefined();
    // First stop keeps its initial morning start
    expect(recalculated.stops[0].time).toBe("09:30");

    // Second stop is Amer Fort, should have transit calculated from 1135 AD
    expect(recalculated.stops[1].title).toBe("Amer Fort Palace");
    expect(recalculated.stops[1].transitFromPrev).toBeDefined();

    // Third stop is Panna Meena, transit calculated from Amer Fort
    expect(recalculated.stops[2].title).toBe("Panna Meena Ka Kund Stepwell");
    expect(recalculated.stops[2].transitFromPrev).toBeDefined();
    expect(recalculated.totalDistanceKm).toBeGreaterThan(0);
    expect(recalculated.totalTransitMinutes).toBeGreaterThan(0);
  });

  it("3. Moving last stop up updates order and recomputes transit", () => {
    // Original: [Amer Fort, 1135 AD, Panna Meena]
    // Move last stop up: [Amer Fort, Panna Meena, 1135 AD]
    const reorderedStops = [sampleStops[0], sampleStops[2], sampleStops[1]];
    const day: ItineraryDay = {
      day: 1,
      title: "Jaipur Heritage",
      theme: "Royal Palaces",
      stops: reorderedStops,
    };

    const recalculated = recalculateDaySchedule(day);

    expect(recalculated.stops[1].title).toBe("Panna Meena Ka Kund Stepwell");
    expect(recalculated.stops[2].title).toBe("1135 AD Royal Dining");
    // Ensure all transitFromPrev are updated correctly
    expect(recalculated.stops[0].transitFromPrev).toBeUndefined();
    expect(recalculated.stops[1].transitFromPrev?.distanceKm).toBeCloseTo(0.5, 0);
  });

  it("4. Removing a middle stop removes leg and recalculates transit directly between 1st and 3rd", () => {
    // Remove 1135 AD (middle stop)
    const filteredStops = [sampleStops[0], sampleStops[2]];
    const day: ItineraryDay = {
      day: 1,
      title: "Jaipur Heritage",
      theme: "Royal Palaces",
      stops: filteredStops,
    };

    const recalculated = recalculateDaySchedule(day);

    expect(recalculated.stops.length).toBe(2);
    expect(recalculated.stops[0].title).toBe("Amer Fort Palace");
    expect(recalculated.stops[1].title).toBe("Panna Meena Ka Kund Stepwell");

    // Leg 1 should now be direct between Amer Fort and Panna Meena
    expect(recalculated.stops[1].transitFromPrev).toBeDefined();
    // Panna Meena arrival time should be computed from Amer Fort departure (09:30 + 120m + transit + 10m buffer)
    expect(recalculated.stops[1].time).toBeDefined();
  });

  it("5. Removing stops down to 1 stop or 0 stops (empty day) handles gracefully", () => {
    // 1-stop day
    const singleStopDay: ItineraryDay = {
      day: 1,
      title: "Jaipur Heritage",
      theme: "Royal Palaces",
      stops: [sampleStops[0]],
    };
    const recalculatedSingle = recalculateDaySchedule(singleStopDay);
    expect(recalculatedSingle.stops.length).toBe(1);
    expect(recalculatedSingle.stops[0].transitFromPrev).toBeUndefined();
    expect(recalculatedSingle.totalDistanceKm).toBe(0);
    expect(recalculatedSingle.totalTransitMinutes).toBe(0);

    // 0-stop day
    const emptyDay: ItineraryDay = {
      day: 1,
      title: "Free Day",
      theme: "Leisure",
      stops: [],
    };
    const recalculatedEmpty = recalculateDaySchedule(emptyDay);
    expect(recalculatedEmpty.stops.length).toBe(0);
    expect(recalculatedEmpty.totalDistanceKm).toBe(0);
    expect(recalculatedEmpty.totalTransitMinutes).toBe(0);
  });

  it("6. Reordering food and attraction stops preserves lunch window or advances if late", () => {
    const day: ItineraryDay = {
      day: 1,
      title: "Jaipur Heritage",
      theme: "Royal Palaces",
      stops: sampleStops,
    };
    const recalculated = recalculateDaySchedule(day);

    // First stop at 09:30, visit 2 hrs -> ends 11:30.
    // Transit ~8 mins + 10m buffer -> 11:48 earliest.
    // Lunch natural window is 12:15 -> stop 2 (lunch) should be at 12:15
    expect(recalculated.stops[1].time).toBe("12:15");

    // Lunch duration 90m -> departs 13:45.
    // Transit ~8 mins + 10m buffer -> 14:03 earliest.
    // Natural afternoon sight is 15:00 -> stop 3 at 15:00
    expect(recalculated.stops[2].time).toBe("15:00");
  });

  it("7. Immediate stop reordering without prior edit succeeds via base fallback", () => {
    // Simulate initial trip loading state where editedDays is null
    const editedDays: ItineraryDay[] | null = null;
    const tripItinerary: ItineraryDay[] = [
      {
        day: 1,
        title: "Jaipur Heritage",
        theme: "Royal Palaces",
        stops: [...sampleStops],
      },
    ];

    // Using the exact fallback logic from handleMoveStop
    const baseDays = editedDays || tripItinerary || [];
    const dayIdx = baseDays.findIndex(d => d.day === 1);
    expect(dayIdx).toBe(0);

    const targetDay = baseDays[dayIdx]!;
    const newStops = [...targetDay.stops];
    const [moved] = newStops.splice(0, 1);
    newStops.splice(1, 0, moved);

    const updatedDay = recalculateDaySchedule({ ...targetDay, stops: newStops });
    const nextDays = [...baseDays];
    nextDays[dayIdx] = updatedDay;

    expect(nextDays[0].stops[0].title).toBe("1135 AD Royal Dining");
    expect(nextDays[0].stops[1].title).toBe("Amer Fort Palace");
    expect(nextDays[0].stops[0].time).toBe("09:30");
    expect(nextDays[0].stops[1].transitFromPrev).toBeDefined();
  });

  it("8. Breakfast stop insertion inserts at index 0 and recalculates morning schedule", () => {
    // Day starting with a morning attraction at 09:30
    const dayWithoutBreakfast: ItineraryDay = {
      day: 1,
      title: "Amer & Nahargarh",
      theme: "Forts",
      stops: [
        {
          id: "stop-s1",
          title: "Amber Fort & Palace",
          time: "09:30",
          location: "Amer, Jaipur",
          description: "Historic fort",
          duration: "2 hours",
          estimatedCost: 200,
          stopType: "attraction",
          coords: { lat: 26.9855, lng: 75.8513 },
        },
        {
          id: "stop-s2",
          title: "1135 AD",
          time: "12:15",
          location: "Amer, Jaipur",
          description: "Royal lunch",
          duration: "90 minutes · Lunch",
          estimatedCost: 1500,
          stopType: "food",
          mealType: "lunch",
          coords: { lat: 26.9859, lng: 75.8507 },
        },
      ],
    };

    const breakfastCandidate = {
      title: "The Tattoo Cafe & Lounge",
      location: "Opposite Hawa Mahal, Jaipur",
      description: "Breakfast with fort & palace views",
      duration: "45 minutes · Breakfast",
      estimatedCost: 400,
      stopType: "food" as const,
      mealType: "breakfast" as const,
      coords: { lat: 26.9239, lng: 75.8267 },
    };

    const newStop: ItineraryStop = {
      id: generateStableStopId(1, breakfastCandidate.title, dayWithoutBreakfast.stops.length),
      time: "08:00",
      title: breakfastCandidate.title,
      location: breakfastCandidate.location,
      description: breakfastCandidate.description,
      duration: breakfastCandidate.duration,
      estimatedCost: breakfastCandidate.estimatedCost,
      stopType: breakfastCandidate.stopType,
      mealType: breakfastCandidate.mealType,
      coords: breakfastCandidate.coords,
    };

    // Apply handleAddStop insertion logic
    const firstStopMeal = dayWithoutBreakfast.stops.length > 0 ? getStopMealType(dayWithoutBreakfast.stops[0]!) : null;
    const insertIndex = firstStopMeal === "breakfast" ? 1 : 0;
    const newStops = [...dayWithoutBreakfast.stops];
    newStops.splice(insertIndex, 0, newStop);

    const updatedDay = recalculateDaySchedule({
      ...dayWithoutBreakfast,
      stops: newStops,
    });

    // 1. Breakfast must be at index 0 (not appended at the end after lunch)
    expect(updatedDay.stops.length).toBe(3);
    expect(updatedDay.stops[0].title).toBe("The Tattoo Cafe & Lounge");
    expect(updatedDay.stops[0].mealType).toBe("breakfast");
    expect(updatedDay.stops[0].time).toBe("08:00");

    // 2. Amber Fort must now be stop 1, scheduled for 09:30
    expect(updatedDay.stops[1].title).toBe("Amber Fort & Palace");
    expect(updatedDay.stops[1].time).toBe("09:30");
    expect(updatedDay.stops[1].transitToNext).toBeDefined();

    // 3. Lunch at 1135 AD remains stop 2 at 12:15
    expect(updatedDay.stops[2].title).toBe("1135 AD");
    expect(updatedDay.stops[2].mealType).toBe("lunch");
    expect(updatedDay.stops[2].time).toBe("12:15");
  });

  it("9. Lunch and dinner stop additions append sequentially to the end of the day", () => {
    const day: ItineraryDay = {
      day: 1,
      title: "Amer & Nahargarh",
      theme: "Forts",
      stops: [
        {
          id: "stop-s1",
          title: "Amber Fort & Palace",
          time: "09:30",
          location: "Amer, Jaipur",
          description: "Historic fort",
          duration: "2 hours",
          estimatedCost: 200,
          stopType: "attraction",
          coords: { lat: 26.9855, lng: 75.8513 },
        },
      ],
    };

    const dinnerCandidate = {
      title: "Handi Restaurant",
      location: "MI Road, Jaipur",
      description: "Traditional Rajasthani dinner",
      duration: "90 minutes · Dinner",
      estimatedCost: 1200,
      stopType: "food" as const,
      mealType: "dinner" as const,
      coords: { lat: 26.9189, lng: 75.8115 },
    };

    const newStop: ItineraryStop = {
      id: generateStableStopId(1, dinnerCandidate.title, day.stops.length),
      time: "19:00",
      title: dinnerCandidate.title,
      location: dinnerCandidate.location,
      description: dinnerCandidate.description,
      duration: dinnerCandidate.duration,
      estimatedCost: dinnerCandidate.estimatedCost,
      stopType: dinnerCandidate.stopType,
      mealType: dinnerCandidate.mealType,
      coords: dinnerCandidate.coords,
    };

    const newStops = [...day.stops, newStop];
    const updatedDay = recalculateDaySchedule({ ...day, stops: newStops });

    expect(updatedDay.stops.length).toBe(2);
    expect(updatedDay.stops[0].title).toBe("Amber Fort & Palace");
    expect(updatedDay.stops[1].title).toBe("Handi Restaurant");
    expect(updatedDay.stops[1].mealType).toBe("dinner");
    expect(updatedDay.stops[1].time).toBe("19:00");
  });

  it("10. Unsaved changes beforeunload trigger logic activates only when edits exist", () => {
    const originalItinerary: ItineraryDay[] = [
      {
        day: 1,
        theme: "Heritage",
        stops: [sampleStops[0], sampleStops[1]],
      },
    ];

    // Helper mirroring TripDetail's hasUnsavedChanges computation
    function checkHasUnsavedChanges(
      orig: ItineraryDay[],
      edit: ItineraryDay[] | null
    ): boolean {
      if (!edit) return false;
      if (orig.length !== edit.length) return true;
      for (let d = 0; d < orig.length; d++) {
        const oStops = orig[d]?.stops || [];
        const eStops = edit[d]?.stops || [];
        if (oStops.length !== eStops.length) return true;
        for (let s = 0; s < oStops.length; s++) {
          if (oStops[s]?.title !== eStops[s]?.title || oStops[s]?.time !== eStops[s]?.time) {
            return true;
          }
        }
      }
      return false;
    }

    // 1. Initial state (no edits): hasUnsavedChanges must be false
    expect(checkHasUnsavedChanges(originalItinerary, null)).toBe(false);

    // 2. After reordering or adding a stop: hasUnsavedChanges must be true
    const editedItinerary: ItineraryDay[] = [
      {
        day: 1,
        theme: "Heritage",
        stops: [sampleStops[1], sampleStops[0]], // swapped
      },
    ];
    expect(checkHasUnsavedChanges(originalItinerary, editedItinerary)).toBe(true);

    // 3. After save or discard: hasUnsavedChanges returns to false
    const syncedItinerary = [...originalItinerary];
    expect(checkHasUnsavedChanges(originalItinerary, syncedItinerary)).toBe(false);
  });
});
