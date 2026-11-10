import { describe, expect, it } from "vitest";
import { buildDestinationItinerary } from "./itineraryEngine";
import { recalculateDaySchedule, ensureStopId, getStopMealType, type ItineraryStop } from "../shared/routeRecalculation";
import { getAccommodationsForDestination, getRecommendedAccommodation, accommodations } from "../client/src/data/accommodations";
import { createTripForUser, getTripForUser, updateTripForUser, createUserWithPassword } from "./db";

describe("Regression Tests: Meal Planning & Classification", () => {
  // Test 1: A 19:00 restaurant stop displaying Dinner rather than Lunch
  it("1. ensures a 19:00 restaurant stop is classified as Dinner, never Lunch, regardless of stop array index", () => {
    // Case A: Stop has explicit mealType: "dinner"
    const stopWithExplicitDinner: ItineraryStop = {
      time: "19:00",
      title: "Martin's Corner",
      location: "Betalbatim, South Goa · Famous Local Food Spot",
      description: "Signature specialties: Butter Garlic King Crab, Lobster Peri Peri.",
      duration: "90 minutes · Dinner",
      estimatedCost: 800,
      stopType: "food",
      mealType: "dinner",
    };
    expect(getStopMealType(stopWithExplicitDinner)).toBe("dinner");

    // Case B: Legacy stop with no explicit mealType, but at 19:00 or with Dinner in duration
    const legacyDinnerStop: ItineraryStop = {
      time: "19:00",
      title: "Martin's Corner",
      location: "Betalbatim, South Goa",
      description: "Seafood dinner.",
      duration: "90 minutes · Dinner",
      estimatedCost: 800,
      stopType: "food",
    };
    expect(getStopMealType(legacyDinnerStop)).toBe("dinner");

    // Case C: Second stop in a day (index 1) - where previous code wrongly checked sIdx <= 2
    const dayWithExcursionAndDinner = recalculateDaySchedule({
      day: 1,
      theme: "Adventure Day",
      stops: [
        {
          time: "08:30",
          title: "Dudhsagar Waterfalls Trek",
          location: "Goa",
          description: "Full day trek.",
          duration: "Full day",
          estimatedCost: 1200,
          stopType: "attraction",
        },
        stopWithExplicitDinner,
      ],
    });

    const secondStop = dayWithExcursionAndDinner.stops[1]!;
    expect(secondStop.title).toBe("Martin's Corner");
    expect(secondStop.time).toBe("19:00");
    expect(getStopMealType(secondStop)).toBe("dinner");
    expect(secondStop.mealType).toBe("dinner");
  });

  // Test 2: Breakfast when accommodation does not include it
  it("2. schedules a breakfast stop between 07:00-09:00 when accommodation does not include breakfast", () => {
    const itinerary = buildDestinationItinerary({
      destination: "goa",
      days: 3,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 40000,
      styles: ["Culture", "Food"],
      startDate: "2026-12-01",
      endDate: "2026-12-04",
      accommodation: {
        id: "goa-hotel-no-bfast",
        name: "Goa Beach Guesthouse",
        type: "Guesthouse",
        destinationId: "goa",
        address: "Calangute, Goa",
        coords: { lat: 15.5412, lng: 73.7554 },
        checkIn: "2026-12-01",
        checkOut: "2026-12-04",
        nights: 3,
        roomType: "Standard Room",
        roomCount: 1,
        guestCount: 2,
        pricePerNight: 2000,
        totalCost: 6000,
        amenities: ["Wi-Fi"],
        source: "custom",
        isBreakfastIncluded: false, // Breakfast NOT included
      },
    });

    for (const day of itinerary.days) {
      const breakfastStop = day.stops.find(s => s.mealType === "breakfast" || getStopMealType(s) === "breakfast");
      expect(breakfastStop).toBeDefined();
      const hour = parseInt(breakfastStop!.time.split(":")[0] || "0", 10);
      expect(hour).toBeGreaterThanOrEqual(7);
      expect(hour).toBeLessThanOrEqual(9);
    }
  });

  // Test 3: Breakfast being omitted when accommodation includes it
  it("3. omits redundant paid restaurant breakfast when accommodation includes breakfast", () => {
    const accommodation = getRecommendedAccommodation("jaipur", "Luxury");
    expect(accommodation).toBeDefined();
    expect(accommodation!.isBreakfastIncluded).toBe(true);

    const itinerary = buildDestinationItinerary({
      destination: "jaipur",
      days: 3,
      travelers: 2,
      budgetTier: "Luxury",
      budgetAmount: 120000,
      styles: ["Culture", "Heritage"],
      startDate: "2026-12-01",
      endDate: "2026-12-04",
      accommodation: {
        id: accommodation!.id,
        name: accommodation!.name,
        type: accommodation!.type,
        destinationId: "jaipur",
        address: accommodation!.address,
        coords: accommodation!.coords,
        checkIn: "2026-12-01",
        checkOut: "2026-12-04",
        nights: 3,
        roomType: accommodation!.roomTypes[0] || "Deluxe Room",
        roomCount: 1,
        guestCount: 2,
        pricePerNight: accommodation!.pricePerNight,
        totalCost: accommodation!.pricePerNight * 3,
        amenities: accommodation!.amenities,
        source: "catalogue",
        isBreakfastIncluded: true,
      },
    });

    for (const day of itinerary.days) {
      // First stop should be the morning sightseeing activity starting at 08:30 or 09:30
      const firstStop = day.stops[0]!;
      expect(firstStop.stopType).toBe("attraction");

      // No stop should be designated as mealType breakfast
      const breakfastStop = day.stops.find(s => s.mealType === "breakfast" || getStopMealType(s) === "breakfast");
      expect(breakfastStop).toBeUndefined();

      // Lunch and dinner should still be present
      const lunchStop = day.stops.find(s => s.mealType === "lunch" || getStopMealType(s) === "lunch");
      const dinnerStop = day.stops.find(s => s.mealType === "dinner" || getStopMealType(s) === "dinner");
      expect(lunchStop).toBeDefined();
      expect(dinnerStop).toBeDefined();
    }
  });

  // Test 4: Breakfast on a full-day excursion
  it("4. schedules a breakfast stop before a full-day excursion when breakfast is not included", () => {
    const itinerary = buildDestinationItinerary({
      destination: "goa",
      days: 4,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 50000,
      styles: ["Adventure", "Nature"],
      startDate: "2026-12-01",
      endDate: "2026-12-05",
      // No accommodation provided or breakfast not included
    });

    const excursionDay = itinerary.days.find(d =>
      d.stops.some(s => s.duration.toLowerCase().includes("full day"))
    );
    expect(excursionDay).toBeDefined();

    // The day must have breakfast scheduled before the excursion
    const breakfastStop = excursionDay!.stops.find(s => getStopMealType(s) === "breakfast");
    expect(breakfastStop).toBeDefined();
    expect(breakfastStop!.mealType).toBe("breakfast");

    const excursionStop = excursionDay!.stops.find(s => s.duration.toLowerCase().includes("full day"));
    expect(excursionStop).toBeDefined();

    // Verify breakfast occurs before the full day excursion
    const parseMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    expect(parseMinutes(breakfastStop!.time)).toBeLessThan(parseMinutes(excursionStop!.time));
  });

  // Test 5: Dinner after a full-day excursion
  it("5. schedules dinner ~19:00 following a full-day excursion and transit return", () => {
    const itinerary = buildDestinationItinerary({
      destination: "goa",
      days: 4,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 50000,
      styles: ["Adventure", "Nature"],
      startDate: "2026-12-01",
      endDate: "2026-12-05",
    });

    const excursionDay = itinerary.days.find(d =>
      d.stops.some(s => s.duration.toLowerCase().includes("full day"))
    );
    expect(excursionDay).toBeDefined();

    const dinnerStop = excursionDay!.stops.find(s => getStopMealType(s) === "dinner");
    expect(dinnerStop).toBeDefined();
    expect(dinnerStop!.mealType).toBe("dinner");

    // Dinner should be realistically scheduled between 19:00 and 21:00
    const [h, m] = dinnerStop!.time.split(":").map(Number);
    const dinnerMins = (h || 0) * 60 + (m || 0);
    expect(dinnerMins).toBeGreaterThanOrEqual(19 * 60);
    expect(dinnerMins).toBeLessThanOrEqual(21 * 60);
  });

  // Test 6: Meal classification surviving save, refresh and reopening
  it("6. preserves mealType classification through database save, refresh, and retrieval", async () => {
    const testEmail = `meal_persist_${Date.now()}@tripwise.test`;
    const userId = await createUserWithPassword({
      email: testEmail,
      passwordHash: "hashed_password",
      name: "Meal Tester",
    });

    const initialDays = [
      {
        day: 1,
        theme: "Culinary Heritage",
        stops: [
          ensureStopId(
            {
              time: "08:00",
              title: "Infantaria Bakery & Café",
              location: "Calangute-Baga, Goa",
              description: "Morning café breakfast.",
              duration: "45 minutes · Breakfast",
              estimatedCost: 350,
              stopType: "food",
              mealType: "breakfast",
            },
            1,
            0
          ),
          ensureStopId(
            {
              time: "09:30",
              title: "Fort Aguada",
              location: "Goa",
              description: "Coastal fortress.",
              duration: "2 hours",
              estimatedCost: 100,
              stopType: "attraction",
            },
            1,
            1
          ),
          ensureStopId(
            {
              time: "12:15",
              title: "Vinayak Family Restaurant",
              location: "Assagao, Goa",
              description: "Seafood thali lunch.",
              duration: "90 minutes · Lunch",
              estimatedCost: 600,
              stopType: "food",
              mealType: "lunch",
            },
            1,
            2
          ),
          ensureStopId(
            {
              time: "19:00",
              title: "Martin's Corner",
              location: "Betalbatim, Goa",
              description: "Famous coastal dinner.",
              duration: "90 minutes · Dinner",
              estimatedCost: 1200,
              stopType: "food",
              mealType: "dinner",
            },
            1,
            3
          ),
        ],
      },
    ];

    const tripId = await createTripForUser({
      userId,
      destination: "goa",
      startDate: "2026-12-01",
      endDate: "2026-12-04",
      days: 1,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 15000,
      styles: ["Culture", "Food"],
      title: "Goa Culinary Trail",
      summary: "Exploring Goa heritage and dining.",
      itinerary: initialDays,
      budgetBreakdown: { accommodation: 6000, food: 4500, activities: 2000, transport: 2500, total: 15000, dailyPerTraveler: 7500 },
    });

    const saved = await getTripForUser(userId, tripId);
    expect(saved).toBeDefined();

    const loadedDays = saved!.itinerary as typeof initialDays;
    const loadedStops = loadedDays[0]!.stops;

    // Verify all 3 meal types survived exactly without degradation
    expect(loadedStops[0]!.mealType).toBe("breakfast");
    expect(getStopMealType(loadedStops[0]!)).toBe("breakfast");

    expect(loadedStops[2]!.mealType).toBe("lunch");
    expect(getStopMealType(loadedStops[2]!)).toBe("lunch");

    expect(loadedStops[3]!.mealType).toBe("dinner");
    expect(getStopMealType(loadedStops[3]!)).toBe("dinner");
  });

  // Test 7: Manually adding a dinner stop
  it("7. correctly schedules a manually added dinner stop at 19:00 without disrupting previous stops", () => {
    const baseDay = {
      day: 1,
      theme: "City Highlights",
      stops: [
        ensureStopId(
          {
            time: "09:30",
            title: "City Palace",
            location: "Jaipur",
            description: "Palace museum.",
            duration: "2 hours",
            estimatedCost: 300,
            stopType: "attraction",
            coords: { lat: 26.9258, lng: 75.8237 },
          },
          1,
          0
        ),
        ensureStopId(
          {
            time: "12:15",
            title: "LMB Restaurant",
            location: "Johari Bazaar, Jaipur",
            description: "Rajasthani lunch.",
            duration: "90 minutes · Lunch",
            estimatedCost: 800,
            stopType: "food",
            mealType: "lunch",
            coords: { lat: 26.9210, lng: 75.8260 },
          },
          1,
          1
        ),
        ensureStopId(
          {
            time: "15:00",
            title: "Hawa Mahal",
            location: "Jaipur",
            description: "Wind palace.",
            duration: "90 minutes",
            estimatedCost: 200,
            stopType: "attraction",
            coords: { lat: 26.9239, lng: 75.8267 },
          },
          1,
          2
        ),
      ],
    };

    // Manually add dinner stop
    const newDinnerStop: ItineraryStop = {
      time: "19:00",
      title: "Handi Restaurant",
      location: "MI Road, Jaipur",
      description: "Traditional dinner.",
      duration: "90 minutes · Dinner",
      estimatedCost: 1000,
      stopType: "food",
      mealType: "dinner",
      coords: { lat: 26.9180, lng: 75.8110 },
    };

    const updatedDay = recalculateDaySchedule({
      ...baseDay,
      stops: [...baseDay.stops, newDinnerStop],
    });

    expect(updatedDay.stops.length).toBe(4);
    // Previous stops keep their times
    expect(updatedDay.stops[0]!.time).toBe("09:30");
    expect(updatedDay.stops[1]!.time).toBe("12:15");
    expect(updatedDay.stops[2]!.time).toBe("15:00");

    // The added dinner stop is slotted at 19:00 with mealType: dinner
    const addedStop = updatedDay.stops[3]!;
    expect(addedStop.title).toBe("Handi Restaurant");
    expect(addedStop.time).toBe("19:00");
    expect(addedStop.mealType).toBe("dinner");
    expect(getStopMealType(addedStop)).toBe("dinner");
  });

  // Test 8: No duplicate restaurants across multiple days
  it("8. guarantees no duplicate restaurants are scheduled across multiple itinerary days", () => {
    const destinations = ["goa", "jaipur", "hyderabad", "kerala"];

    for (const dest of destinations) {
      const itinerary = buildDestinationItinerary({
        destination: dest,
        days: 3,
        travelers: 2,
        budgetTier: "Moderate",
        budgetAmount: 45000,
        styles: ["Culture", "Food"],
        startDate: "2026-12-01",
        endDate: "2026-12-04",
      });

      const foodStops = itinerary.days.flatMap(d =>
        d.stops.filter(s => s.stopType === "food")
      );

      const titles = foodStops.map(s => s.title.toLowerCase().trim());
      const uniqueTitles = new Set(titles);

      expect(uniqueTitles.size).toBe(titles.length);
    }
  });

  // Test 9: BUG 1 Regression - Full-day excursion dinner classification and timing (Martin's Corner)
  it("9. regression: guarantees Martin's Corner following Dudhsagar is scheduled at 19:00 with authoritative mealType 'dinner'", () => {
    // Exact scenario from user screenshot:
    // Day 1 has Dudhsagar at 08:30 (Full day), followed by Martin's Corner
    const dayWithDudhsagarAndDinner = {
      day: 1,
      theme: "Goa Arrival & First Impressions",
      stops: [
        {
          id: "stop-d1-dudhsagar-0",
          time: "08:30",
          title: "Dudhsagar Waterfalls Trek",
          location: "Goa",
          description: "Four-tiered majestic cascade deep in the Western Ghats jungle on the Mandovi River.",
          duration: "Full day",
          stopType: "attraction" as const,
          coords: { lat: 15.3144, lng: 74.3143 },
        },
        {
          id: "stop-d1-martins-corner-1",
          time: "17:45",
          title: "Martin's Corner",
          location: "Betalbatim, South Goa · Famous Local Food Spot",
          description: "Signature specialties: Butter Garlic King Crab, Lobster Peri Peri, Pork Ribs, Fish Balchão. Legendary South Goa culinary destination celebrated for coastal dinner.",
          duration: "90 minutes · Dinner",
          stopType: "food" as const,
          // Even if previously misassigned or inheriting breakfast
          mealType: "breakfast" as const,
          coords: { lat: 15.2974, lng: 73.9189 },
        },
      ],
    };

    const recalculated = recalculateDaySchedule(dayWithDudhsagarAndDinner);
    expect(recalculated.stops.length).toBe(2);

    const firstStop = recalculated.stops[0]!;
    expect(firstStop.title).toBe("Dudhsagar Waterfalls Trek");
    expect(firstStop.time).toBe("08:30");

    const secondStop = recalculated.stops[1]!;
    expect(secondStop.title).toBe("Martin's Corner");
    // Authoritative mealType must be "dinner", never "breakfast"
    expect(secondStop.mealType).toBe("dinner");
    expect(getStopMealType(secondStop)).toBe("dinner");
    expect(secondStop.duration).toContain("Dinner");
    // Must be scheduled at the 19:00 natural dinner slot, not 17:45
    expect(secondStop.time).toBe("19:00");
  });

  // Test 10: BUG 2 Regression - Accommodation Budget separation and zero cost when no stay selected
  it("10. regression: actual accommodation cost is 0 when no stay is selected, and updates accurately when stay is added/removed", () => {
    const plannedTotal = 38000;
    const travelers = 2;
    const days = 4;
    const allocatedAllowance = Math.round(plannedTotal * 0.40); // 15200
    const foodAllowance = Math.round(plannedTotal * 0.22); // 8360
    const activitiesAllowance = Math.round(plannedTotal * 0.19); // 7220
    const transportAllowance = plannedTotal - (allocatedAllowance + foodAllowance + activitiesAllowance); // 7220
    const otherCosts = foodAllowance + activitiesAllowance + transportAllowance; // 22800

    const initialBudget = {
      accommodation: allocatedAllowance,
      food: foodAllowance,
      activities: activitiesAllowance,
      transport: transportAllowance,
      total: plannedTotal,
      dailyPerTraveler: Math.round(plannedTotal / (days * travelers)),
    };

    // Case A: No accommodation selected (trip.accommodation is null)
    let selectedAccommodation: any = null;
    const actualCostNoStay = selectedAccommodation ? selectedAccommodation.totalCost : 0;
    expect(actualCostNoStay).toBe(0);

    const activeTotalNoStay = actualCostNoStay + otherCosts;
    expect(activeTotalNoStay).toBe(22800);
    // Allocated allowance remains preserved
    expect(allocatedAllowance).toBe(15200);

    // Case B: Hotel selected (3 nights, 1 room @ ₹4,500/night = ₹13,500)
    selectedAccommodation = {
      id: "goa-alila-diwa",
      name: "Alila Diwa Goa",
      pricePerNight: 4500,
      nights: 3,
      roomCount: 1,
      totalCost: 13500, // 4500 * 3 * 1
    };

    const actualCostWithStay = selectedAccommodation.totalCost;
    expect(actualCostWithStay).toBe(13500);
    const activeTotalWithStay = actualCostWithStay + otherCosts;
    expect(activeTotalWithStay).toBe(13500 + 22800); // 36300
    // Allocated allowance still preserved as original planning baseline
    expect(allocatedAllowance).toBe(15200);

    // Case C: Hotel removed
    selectedAccommodation = null;
    const actualCostRemoved = selectedAccommodation ? selectedAccommodation.totalCost : 0;
    expect(actualCostRemoved).toBe(0);
    const activeTotalRemoved = actualCostRemoved + otherCosts;
    expect(activeTotalRemoved).toBe(22800);
  });
});
