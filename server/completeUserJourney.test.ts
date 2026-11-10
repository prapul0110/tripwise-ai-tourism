import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getAvailableStopsForDestination } from "../client/src/lib/destinationStops";
import {
  recalculateDaySchedule,
  ensureStopId,
  generateStableStopId,
  type ItineraryDay,
  type ItineraryStop,
} from "../shared/routeRecalculation";
import { buildDestinationItinerary } from "./itineraryEngine";
import { TRPCError } from "@trpc/server";

function createMockContext(user: TrpcContext["user"] = null): {
  ctx: TrpcContext;
  cookiesSet: Record<string, string>;
  cookiesCleared: string[];
} {
  const cookiesSet: Record<string, string> = {};
  const cookiesCleared: string[] = [];

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "http",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, val: string) => {
        cookiesSet[name] = val;
      },
      clearCookie: (name: string) => {
        cookiesCleared.push(name);
      },
    } as unknown as TrpcContext["res"],
  };

  return { ctx, cookiesSet, cookiesCleared };
}

describe("Stage 4: Complete User Journey & Regression Verification", () => {
  it("1. Complete User Journey: Register -> Login -> Explore -> Generate -> Edit -> Reorder -> Remove -> Save -> Reload -> Relogin", async () => {
    // Step 1: Register a new user
    const { ctx: anonCtx, cookiesSet: regCookies } = createMockContext(null);
    const anonCaller = appRouter.createCaller(anonCtx);

    const testEmail = `traveler_${Date.now()}@tripwise.in`;
    const testPassword = "SecretPassword123!";
    const testName = "Aanya Sharma";

    const regResult = await anonCaller.auth.register({
      email: testEmail,
      password: testPassword,
      name: testName,
    });

    expect(regResult.success).toBe(true);
    expect(regResult.user.email).toBe(testEmail);
    expect(regResult.user.id).toBeGreaterThan(0);
    const userId = regResult.user.id;

    // Step 2: Log in
    const { ctx: loginCtx, cookiesSet: loginCookies } = createMockContext(null);
    const loginCaller = appRouter.createCaller(loginCtx);

    const loginResult = await loginCaller.auth.login({
      email: testEmail,
      password: testPassword,
    });

    expect(loginResult.success).toBe(true);
    expect(loginResult.user.id).toBe(userId);

    // Create an authenticated caller representing Aanya
    const user = {
      id: userId,
      openId: `usr_${userId}`,
      email: testEmail,
      name: testName,
      passwordHash: "hash",
      loginMethod: "password",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const { ctx: authCtx } = createMockContext(user);
    const authCaller = appRouter.createCaller(authCtx);

    // Step 3: Explore Indian destinations
    const { destination, attractions, foodPlaces, allCandidates } =
      getAvailableStopsForDestination("Jaipur", []);
    expect(destination.name).toBe("Jaipur");
    expect(attractions.length).toBeGreaterThan(0);
    expect(foodPlaces.length).toBeGreaterThan(0);

    // Step 4: Generate a new itinerary
    const generated = buildDestinationItinerary({
      destination: "Jaipur",
      days: 3,
      budgetTier: "Moderate",
      travelers: 2,
      styles: ["Culture", "Food"],
    });

    expect(generated.days.length).toBe(3);
    expect(generated.title).toContain("Jaipur");

    // Step 5: Save/Open the generated trip in user's dashboard
    const { id: tripId } = await authCaller.travel.createTrip({
      destination: "Jaipur",
      startDate: "2026-12-10",
      endDate: "2026-12-13",
      days: 3,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 45000,
      styles: ["Culture", "Food"],
      title: generated.title,
      summary: generated.summary,
      itinerary: generated.days,
      budget: {
        accommodation: 18000,
        food: 10000,
        transport: 8000,
        activities: 9000,
        total: 45000,
        dailyPerTraveler: 7500,
      },
    });

    expect(tripId).toBeGreaterThan(0);

    let activeTrip = await authCaller.travel.getTrip({ id: tripId });
    expect(activeTrip.id).toBe(tripId);
    let itinerary = activeTrip.itinerary as ItineraryDay[];
    const day1InitialStopsCount = itinerary[0]!.stops.length;

    // Step 6: Add an attraction (e.g., Galtaji Sun Temple Kunds or Jagat Shiromani)
    const available = getAvailableStopsForDestination("Jaipur", itinerary);
    const attractionToAdd = available.attractions.find(
      a => !itinerary.some(d => d.stops.some(s => s.title === a.title))
    ) || available.attractions[0]!;

    const newAttractionStop: ItineraryStop = {
      id: generateStableStopId(1, attractionToAdd.title, itinerary[0]!.stops.length),
      time: "15:00",
      title: attractionToAdd.title,
      location: attractionToAdd.location,
      description: attractionToAdd.description,
      duration: attractionToAdd.duration,
      estimatedCost: attractionToAdd.estimatedCost,
      stopType: attractionToAdd.stopType,
      coords: attractionToAdd.coords,
    };

    let updatedDay1 = recalculateDaySchedule({
      ...itinerary[0]!,
      stops: [...itinerary[0]!.stops, newAttractionStop],
    });

    // Step 7: Add a food stop (e.g. LMB or Rawat)
    const availableFood = getAvailableStopsForDestination("Jaipur", [
      updatedDay1,
      ...itinerary.slice(1),
    ]);
    const foodToAdd = availableFood.foodPlaces[0]!;

    const newFoodStop: ItineraryStop = {
      id: generateStableStopId(1, foodToAdd.title, updatedDay1.stops.length),
      time: "12:15",
      title: foodToAdd.title,
      location: foodToAdd.location,
      description: foodToAdd.description,
      duration: foodToAdd.duration,
      estimatedCost: foodToAdd.estimatedCost,
      stopType: foodToAdd.stopType,
      specialties: foodToAdd.specialties,
      coords: foodToAdd.coords,
    };

    updatedDay1 = recalculateDaySchedule({
      ...updatedDay1,
      stops: [...updatedDay1.stops, newFoodStop],
    });

    expect(updatedDay1.stops.length).toBe(day1InitialStopsCount + 2);

    // Step 8: Move stops up and down
    // Move newly added food stop from last position to index 1 (between morning sight and afternoon sight)
    const currentStops = [...updatedDay1.stops];
    const foodItem = currentStops.pop()!;
    currentStops.splice(1, 0, foodItem);

    updatedDay1 = recalculateDaySchedule({
      ...updatedDay1,
      stops: currentStops,
    });
    expect(updatedDay1.stops[1]!.title).toBe(foodToAdd.title);

    // Step 9: Remove a stop
    const stopsBeforeRemoval = updatedDay1.stops.length;
    const removedTitle = updatedDay1.stops[0]!.title;
    const stopsAfterRemoval = updatedDay1.stops.slice(1);
    updatedDay1 = recalculateDaySchedule({
      ...updatedDay1,
      stops: stopsAfterRemoval,
    });
    expect(updatedDay1.stops.length).toBe(stopsBeforeRemoval - 1);
    expect(updatedDay1.stops.some(s => s.title === removedTitle)).toBe(false);

    // Step 10: Save changes permanently
    const fullUpdatedItinerary: ItineraryDay[] = [
      updatedDay1,
      itinerary[1]!,
      itinerary[2]!,
    ];

    const saveResult = await authCaller.travel.updateTrip({
      id: tripId,
      itinerary: fullUpdatedItinerary,
    });
    expect(saveResult.success).toBe(true);

    // Step 11 & 12: Refresh browser / reload trip
    const reloadedTrip = await authCaller.travel.getTrip({ id: tripId });
    const reloadedDays = reloadedTrip.itinerary as ItineraryDay[];
    expect(reloadedDays[0]!.stops.length).toBe(updatedDay1.stops.length);
    expect(reloadedDays[0]!.stops[0]!.title).toBe(updatedDay1.stops[0]!.title);
    expect(reloadedDays[0]!.totalDistanceKm).toBe(updatedDay1.totalDistanceKm);

    // Step 13: Log out and log back in
    const { cookiesCleared: logoutCookies } = createMockContext(user);
    authCaller.auth.logout();

    // Log back in as Aanya
    const reloginResult = await anonCaller.auth.login({
      email: testEmail,
      password: testPassword,
    });
    expect(reloginResult.success).toBe(true);
    expect(reloginResult.user.id).toBe(userId);

    // Step 14: Verify that the saved trip is in user's list and contains all edits
    const userTrips = await authCaller.travel.listTrips();
    const verifiedTrip = userTrips.find(t => t.id === tripId);
    expect(verifiedTrip).toBeDefined();
    const verifiedDays = verifiedTrip!.itinerary as ItineraryDay[];
    expect(verifiedDays[0]!.stops.length).toBe(updatedDay1.stops.length);
  });

  it("2. Database Reliability: updateTripForUser preserves unrelated fields and refuses unauthorized access", async () => {
    const userA = {
      id: 201,
      openId: "usr_201",
      email: "usera@tripwise.in",
      name: "User A",
      passwordHash: "h",
      loginMethod: "password",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const userB = {
      id: 202,
      openId: "usr_202",
      email: "userb@tripwise.in",
      name: "User B",
      passwordHash: "h",
      loginMethod: "password",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const callerA = appRouter.createCaller(createMockContext(userA).ctx);
    const callerB = appRouter.createCaller(createMockContext(userB).ctx);

    // User A creates a trip
    const { id: tripId } = await callerA.travel.createTrip({
      destination: "Goa",
      startDate: "2026-11-20",
      endDate: "2026-11-23",
      days: 3,
      travelers: 4,
      budgetTier: "Luxury",
      budgetAmount: 120000,
      styles: ["Relaxation", "Food"],
      title: "Goa Luxury Retreat",
      summary: "Three days of coastal luxury and private dining in Goa.",
      itinerary: [
        {
          day: 1,
          theme: "Coastal Breeze",
          stops: [
            {
              id: "stop-1",
              time: "09:30",
              title: "Baga Beach",
              location: "Goa",
              description: "Beachfront",
              duration: "2 hours",
              estimatedCost: 500,
            },
          ],
        },
      ],
      budget: {
        accommodation: 60000,
        food: 30000,
        transport: 15000,
        activities: 15000,
        total: 120000,
        dailyPerTraveler: 10000,
      },
    });

    // 1. Verify User B CANNOT read User A's trip
    await expect(callerB.travel.getTrip({ id: tripId })).rejects.toThrowError(
      TRPCError
    );

    // 2. Verify User B CANNOT modify User A's trip
    await expect(
      callerB.travel.updateTrip({
        id: tripId,
        itinerary: [
          {
            day: 1,
            theme: "Hacked by User B",
            stops: [],
          },
        ],
      })
    ).rejects.toThrowError(TRPCError);

    // 3. User A modifies the trip
    const updatedItinerary = [
      {
        day: 1,
        theme: "South Goa Serenity",
        stops: [
          {
            id: "stop-1",
            time: "09:30",
            title: "Palolem Beach & Canoe Haven",
            location: "Goa",
            description: "Gentle crescent bay with calm waters.",
            duration: "3 hours",
            estimatedCost: 600,
          },
        ],
      },
    ];

    await callerA.travel.updateTrip({
      id: tripId,
      itinerary: updatedItinerary,
    });

    // 4. Verify that unrelated fields (destination, dates, travelers, budgetTier, budgetAmount) were NOT modified
    const tripA = await callerA.travel.getTrip({ id: tripId });
    expect(tripA.destination).toBe("Goa");
    expect(tripA.startDate).toBe("2026-11-20");
    expect(tripA.endDate).toBe("2026-11-23");
    expect(tripA.travelers).toBe(4);
    expect(tripA.budgetTier).toBe("Luxury");
    expect(tripA.budgetAmount).toBe(120000);
    // And itinerary is updated
    const days = tripA.itinerary as typeof updatedItinerary;
    expect(days[0]!.theme).toBe("South Goa Serenity");
    expect(days[0]!.stops[0]!.title).toBe("Palolem Beach & Canoe Haven");
  });

  it("3. Route & Itinerary Regression across multiple destinations (Goa, Hyderabad, Jaipur, Kerala)", () => {
    const destinations = ["Goa", "Hyderabad", "Jaipur", "Kerala"];
    const durations = [1, 3, 5];

    for (const dest of destinations) {
      for (const days of durations) {
        const plan = buildDestinationItinerary({
          destination: dest,
          days,
          budgetTier: "Moderate",
          travelers: 2,
          styles: ["Culture", "Nature"],
        });

        expect(plan.days.length).toBe(days);
        // Verify every day has valid sequential schedule
        for (const day of plan.days) {
          expect(day.stops.length).toBeGreaterThan(0);
          expect(day.day).toBeGreaterThan(0);
          expect(day.theme.length).toBeGreaterThan(0);

          // Verify time formatting
          for (const stop of day.stops) {
            expect(stop.time).toMatch(/^\d{2}:\d{2}$/);
            expect(stop.title.length).toBeGreaterThan(0);
            expect(stop.duration.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("4. Empty day, single-stop day, and dynamic meal slot recovery", () => {
    // 0-stop day
    const emptyDay: ItineraryDay = {
      day: 1,
      theme: "Free Day",
      stops: [],
    };
    const recalcEmpty = recalculateDaySchedule(emptyDay);
    expect(recalcEmpty.stops.length).toBe(0);
    expect(recalcEmpty.totalDistanceKm).toBe(0);
    expect(recalcEmpty.totalTransitMinutes).toBe(0);

    // 1-stop day
    const singleStopDay: ItineraryDay = {
      day: 2,
      theme: "Quiet Sight",
      stops: [
        {
          id: "stop-single",
          title: "Hawa Mahal Palace of Winds",
          time: "15:00", // Will be normalized to morning start 09:30
          duration: "1 hour",
          location: "Jaipur",
          description: "Palace",
          estimatedCost: 100,
        },
      ],
    };
    const recalcSingle = recalculateDaySchedule(singleStopDay);
    expect(recalcSingle.stops.length).toBe(1);
    expect(recalcSingle.stops[0]!.time).toBe("09:30");
    expect(recalcSingle.stops[0]!.transitToNext).toBeUndefined();

    // 3-stop day with lunch: verify lunch window is respected
    const threeStopDay: ItineraryDay = {
      day: 3,
      theme: "City Trail",
      stops: [
        {
          id: "s1",
          title: "Morning Palace",
          time: "09:30",
          duration: "2 hours",
          location: "City",
          description: "Palace",
          estimatedCost: 200,
          coords: { lat: 26.9855, lng: 75.8513 },
        },
        {
          id: "s2",
          title: "Local Heritage Lunch",
          time: "12:15",
          duration: "90 minutes · Lunch",
          location: "City",
          description: "Lunch",
          stopType: "food",
          estimatedCost: 500,
          coords: { lat: 26.9850, lng: 75.8510 },
        },
        {
          id: "s3",
          title: "Sunset Fort",
          time: "15:00",
          duration: "2 hours",
          location: "City",
          description: "Fort",
          estimatedCost: 300,
          coords: { lat: 26.9840, lng: 75.8500 },
        },
      ],
    };
    const recalcThree = recalculateDaySchedule(threeStopDay);
    expect(recalcThree.stops[0]!.time).toBe("09:30");
    expect(recalcThree.stops[1]!.time).toBe("12:15");
    expect(recalcThree.stops[2]!.time).toBe("15:00");
  });
});
