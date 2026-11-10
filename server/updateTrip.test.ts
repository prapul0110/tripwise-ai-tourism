import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { TRPCError } from "@trpc/server";

function createMockContext(userId: number, email = `user${userId}@tripwise.in`): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `usr_test_${userId}`,
      email,
      name: `User ${userId}`,
      passwordHash: "hash123",
      loginMethod: "password",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "http",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("Stage 3: Permanent Manual Itinerary Saving & Security", () => {
  const user1Ctx = createMockContext(101);
  const user2Ctx = createMockContext(102);

  const callerUser1 = appRouter.createCaller(user1Ctx);
  const callerUser2 = appRouter.createCaller(user2Ctx);

  const initialItinerary = [
    {
      day: 1,
      theme: "Jaipur Heritage",
      stops: [
        {
          id: "stop-d1-amer-1",
          time: "09:30",
          title: "Amer Fort Palace",
          location: "Amer, Jaipur",
          description: "Magnificent amber sandstone fortress atop hill.",
          duration: "2 hours",
          estimatedCost: 550,
          stopType: "attraction" as const,
          coords: { lat: 26.9855, lng: 75.8513 },
        },
        {
          id: "stop-d1-lmb-2",
          time: "12:15",
          title: "Laxmi Mishthan Bhandar (LMB)",
          location: "Johari Bazaar, Jaipur",
          description: "Famous local vegetarian restaurant in Jaipur.",
          duration: "90 minutes · Lunch",
          estimatedCost: 800,
          stopType: "food" as const,
          specialties: ["Rajasthani Royal Thali", "Paneer Ghewar"],
          coords: { lat: 26.9208, lng: 75.8248 },
          transitToNext: {
            distanceKm: 0.5,
            durationMinutes: 8,
            formattedDistance: "500 m (est.)",
            formattedDuration: "8 mins (est.)",
            source: "estimate" as const,
          },
        },
      ],
    },
  ];

  it("1. Successfully creates and saves a modified itinerary for the trip owner", async () => {
    // 1. Create a trip for User 1
    const { id } = await callerUser1.travel.createTrip({
      destination: "Jaipur",
      startDate: "2026-12-01",
      endDate: "2026-12-03",
      days: 1,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 25000,
      styles: ["Culture", "Food"],
      title: "Jaipur Express",
      summary: "A memorable 1-day exploration of Jaipur palaces and royal flavors.",
      itinerary: initialItinerary,
      budget: {
        accommodation: 10000,
        food: 5500,
        transport: 4500,
        activities: 5000,
        total: 25000,
        dailyPerTraveler: 12500,
      },
    });

    expect(id).toBeGreaterThan(0);

    // 2. Modify stop time and duration
    const modifiedItinerary = [
      {
        ...initialItinerary[0]!,
        theme: "Jaipur Regal Explorer",
        stops: [
          {
            ...initialItinerary[0]!.stops[0]!,
            duration: "3 hours",
            description: "Extended morning tour of Amer Fort ramparts and palace.",
          },
          initialItinerary[0]!.stops[1]!,
        ],
      },
    ];

    // 3. Save modified itinerary
    const updateResult = await callerUser1.travel.updateTrip({
      id,
      itinerary: modifiedItinerary,
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.trip).toBeDefined();

    // 4. Verify persisted state via getTrip
    const fetched = await callerUser1.travel.getTrip({ id });
    expect(fetched.id).toBe(id);
    const fetchedDays = fetched.itinerary as typeof initialItinerary;
    expect(fetchedDays[0]?.theme).toBe("Jaipur Regal Explorer");
    expect(fetchedDays[0]?.stops[0]?.duration).toBe("3 hours");
  });

  it("2. Saves a modified itinerary with added stops", async () => {
    const { id } = await callerUser1.travel.createTrip({
      destination: "Jaipur",
      startDate: "2026-12-01",
      endDate: "2026-12-03",
      days: 1,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 25000,
      styles: ["Culture", "Food"],
      title: "Jaipur Day Tour",
      summary: "Exploring historic sights and culinary spots across Jaipur.",
      itinerary: initialItinerary,
      budget: {
        accommodation: 10000,
        food: 5500,
        transport: 4500,
        activities: 5000,
        total: 25000,
        dailyPerTraveler: 12500,
      },
    });

    const withAddedStop = [
      {
        ...initialItinerary[0]!,
        stops: [
          ...initialItinerary[0]!.stops,
          {
            id: "stop-d1-hawa-3",
            time: "15:00",
            title: "Hawa Mahal Palace of Winds",
            location: "Jaipur, Rajasthan",
            description: "Iconic five-story pink honeycomb facade.",
            duration: "1 hour",
            estimatedCost: 200,
            stopType: "attraction" as const,
            coords: { lat: 26.9239, lng: 75.8267 },
          },
        ],
      },
    ];

    const result = await callerUser1.travel.updateTrip({
      id,
      itinerary: withAddedStop,
    });

    expect(result.success).toBe(true);
    const fetched = await callerUser1.travel.getTrip({ id });
    const fetchedDays = fetched.itinerary as typeof withAddedStop;
    expect(fetchedDays[0]?.stops.length).toBe(3);
    expect(fetchedDays[0]?.stops[2]?.title).toBe("Hawa Mahal Palace of Winds");
  });

  it("3. Saves after removing stops", async () => {
    const { id } = await callerUser1.travel.createTrip({
      destination: "Jaipur",
      startDate: "2026-12-01",
      endDate: "2026-12-03",
      days: 1,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 25000,
      styles: ["Culture", "Food"],
      title: "Jaipur Day Tour",
      summary: "Exploring historic sights and culinary spots across Jaipur.",
      itinerary: initialItinerary,
      budget: {
        accommodation: 10000,
        food: 5500,
        transport: 4500,
        activities: 5000,
        total: 25000,
        dailyPerTraveler: 12500,
      },
    });

    // Remove 2nd stop (LMB)
    const withRemovedStop = [
      {
        ...initialItinerary[0]!,
        stops: [initialItinerary[0]!.stops[0]!],
      },
    ];

    const result = await callerUser1.travel.updateTrip({
      id,
      itinerary: withRemovedStop,
    });

    expect(result.success).toBe(true);
    const fetched = await callerUser1.travel.getTrip({ id });
    const fetchedDays = fetched.itinerary as typeof withRemovedStop;
    expect(fetchedDays[0]?.stops.length).toBe(1);
    expect(fetchedDays[0]?.stops[0]?.title).toBe("Amer Fort Palace");
  });

  it("4. Saves after reordering stops", async () => {
    const { id } = await callerUser1.travel.createTrip({
      destination: "Jaipur",
      startDate: "2026-12-01",
      endDate: "2026-12-03",
      days: 1,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 25000,
      styles: ["Culture", "Food"],
      title: "Jaipur Day Tour",
      summary: "Exploring historic sights and culinary spots across Jaipur.",
      itinerary: initialItinerary,
      budget: {
        accommodation: 10000,
        food: 5500,
        transport: 4500,
        activities: 5000,
        total: 25000,
        dailyPerTraveler: 12500,
      },
    });

    // Reverse order of stops
    const reordered = [
      {
        ...initialItinerary[0]!,
        stops: [initialItinerary[0]!.stops[1]!, initialItinerary[0]!.stops[0]!],
      },
    ];

    const result = await callerUser1.travel.updateTrip({
      id,
      itinerary: reordered,
    });

    expect(result.success).toBe(true);
    const fetched = await callerUser1.travel.getTrip({ id });
    const fetchedDays = fetched.itinerary as typeof reordered;
    expect(fetchedDays[0]?.stops[0]?.title).toBe("Laxmi Mishthan Bhandar (LMB)");
    expect(fetchedDays[0]?.stops[1]?.title).toBe("Amer Fort Palace");
  });

  it("5. Security: Rejects another user's attempt to modify or overwrite a trip", async () => {
    // Trip created by User 1
    const { id } = await callerUser1.travel.createTrip({
      destination: "Jaipur",
      startDate: "2026-12-01",
      endDate: "2026-12-03",
      days: 1,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 25000,
      styles: ["Culture"],
      title: "Private User 1 Trip",
      summary: "Confidential private vacation itinerary belonging to User 1.",
      itinerary: initialItinerary,
      budget: {
        accommodation: 10000,
        food: 5500,
        transport: 4500,
        activities: 5000,
        total: 25000,
        dailyPerTraveler: 12500,
      },
    });

    // User 2 attempts to overwrite User 1's trip
    await expect(
      callerUser2.travel.updateTrip({
        id,
        itinerary: initialItinerary,
      })
    ).rejects.toThrowError(TRPCError);

    // Verify User 2 gets FORBIDDEN error code
    try {
      await callerUser2.travel.updateTrip({
        id,
        itinerary: initialItinerary,
      });
      expect.unreachable("Should have thrown FORBIDDEN");
    } catch (err) {
      expect(err instanceof TRPCError).toBe(true);
      if (err instanceof TRPCError) {
        expect(err.code).toBe("FORBIDDEN");
      }
    }

    // Verify trip content was not altered
    const tripStillUnchanged = await callerUser1.travel.getTrip({ id });
    expect(tripStillUnchanged.title).toBe("Private User 1 Trip");
  });

  it("6. Rejects invalid data and malformed payloads", async () => {
    // 1. Invalid trip ID (negative)
    await expect(
      callerUser1.travel.updateTrip({
        id: -5,
        itinerary: initialItinerary,
      })
    ).rejects.toThrow();

    // 2. Invalid itinerary (empty days array)
    await expect(
      callerUser1.travel.updateTrip({
        id: 1,
        itinerary: [] as any,
      })
    ).rejects.toThrow();
  });

  it("7. Backward compatibility: Saves an older trip format without stop IDs", async () => {
    const olderStopsWithoutId = [
      {
        // No id property!
        time: "09:30",
        title: "Amer Fort Palace",
        location: "Amer, Jaipur",
        description: "Historic fortress.",
        duration: "2 hours",
        estimatedCost: 550,
      },
      {
        // No id property, no transitToNext
        time: "12:15",
        title: "Laxmi Mishthan Bhandar (LMB)",
        location: "Johari Bazaar, Jaipur",
        description: "Local sweets and lunch.",
        duration: "90 minutes",
        estimatedCost: 800,
      },
    ];

    const olderDay = [
      {
        day: 1,
        theme: "Heritage",
        stops: olderStopsWithoutId,
      },
    ];

    const { id } = await callerUser1.travel.createTrip({
      destination: "Jaipur",
      startDate: "2026-12-01",
      endDate: "2026-12-03",
      days: 1,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 25000,
      styles: ["Culture"],
      title: "Older Format Trip",
      summary: "A legacy trip saved before stop IDs existed.",
      itinerary: olderDay,
      budget: {
        accommodation: 10000,
        food: 5500,
        transport: 4500,
        activities: 5000,
        total: 25000,
        dailyPerTraveler: 12500,
      },
    });

    // Update it directly without breaking
    const updateResult = await callerUser1.travel.updateTrip({
      id,
      itinerary: olderDay,
    });

    expect(updateResult.success).toBe(true);
    const fetched = await callerUser1.travel.getTrip({ id });
    expect(fetched.id).toBe(id);
  });

  it("8. Reopening a trip verifies persisted changes across multiple sessions", async () => {
    const { id } = await callerUser1.travel.createTrip({
      destination: "Jaipur",
      startDate: "2026-12-01",
      endDate: "2026-12-03",
      days: 1,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 25000,
      styles: ["Culture"],
      title: "Persistent Journey",
      summary: "Trip that must persist across browser sessions.",
      itinerary: initialItinerary,
      budget: {
        accommodation: 10000,
        food: 5500,
        transport: 4500,
        activities: 5000,
        total: 25000,
        dailyPerTraveler: 12500,
      },
    });

    // Save customized itinerary
    const newTitle = "Jaipur Royal Journey Persisted";
    const updatedItinerary = [
      {
        ...initialItinerary[0]!,
        theme: "Royal Mahals & Bazaars",
      },
    ];

    await callerUser1.travel.updateTrip({
      id,
      title: newTitle,
      itinerary: updatedItinerary,
    });

    // Simulate reopening in a new session
    const freshCaller = appRouter.createCaller(user1Ctx);
    const reopened = await freshCaller.travel.getTrip({ id });

    expect(reopened.title).toBe(newTitle);
    const reopenedDays = reopened.itinerary as typeof updatedItinerary;
    expect(reopenedDays[0]?.theme).toBe("Royal Mahals & Bazaars");
  });

  it("9. Preserves edits when the server returns an error", async () => {
    // If client attempts to save an update to a non-existent trip ID:
    const clientDraftItinerary = [
      {
        day: 1,
        theme: "Unsaved Client Changes",
        stops: initialItinerary[0]!.stops,
      },
    ];

    // Attempt saving to invalid ID (e.g., 999999)
    await expect(
      callerUser1.travel.updateTrip({
        id: 999999,
        itinerary: clientDraftItinerary,
      })
    ).rejects.toThrow();

    // The client's draft data remains intact in memory
    expect(clientDraftItinerary[0]?.theme).toBe("Unsaved Client Changes");
    expect(clientDraftItinerary[0]?.stops.length).toBe(2);
  });
});
