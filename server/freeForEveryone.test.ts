import { describe, expect, it } from "vitest";
import { appRouter, tripInput } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(user = null as TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "http", headers: {} } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("TripWise AI Free-for-Everyone Access Model", () => {
  const mockUser = {
    id: 99,
    openId: "usr_free_test_99",
    email: "traveler@tripwise.in",
    name: "Aarav Mehta",
    passwordHash: "hash123",
    loginMethod: "password",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  it("subscription.current returns full active unmetered access for any authenticated user", async () => {
    const ctx = createMockContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    const subscription = await caller.subscription.current();
    expect(subscription).toBeDefined();
    expect(subscription.status).toBe("active");
    expect(subscription.isFullAccess).toBe(true);
    expect(subscription.isUnlimited).toBe(true);
    expect(subscription.renewalDate).toBeNull();
  });

  it("subscription.selectDemoPlan returns success without requiring payment", async () => {
    const ctx = createMockContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.selectDemoPlan({ plan: "free" });
    expect(result.success).toBe(true);
    expect(result.message).toContain("completely free");
  });

  it("allows any authenticated user to generate itineraries without subscription gating", async () => {
    const ctx = createMockContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    const input = tripInput.parse({
      destination: "Goa",
      startDate: "2026-11-20",
      endDate: "2026-11-23",
      days: 4,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 40000,
      styles: ["Relaxation", "Food"],
    });

    const itinerary = await caller.travel.generateItinerary(input);
    expect(itinerary).toBeDefined();
    expect(itinerary.days).toHaveLength(4);
    expect(itinerary.days[0]!.stops.length).toBeGreaterThanOrEqual(2);
  });

  it("allows any authenticated user to create and save trips without quota blocks", async () => {
    const ctx = createMockContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    const input = tripInput.parse({
      destination: "Jaipur",
      startDate: "2026-12-01",
      endDate: "2026-12-03",
      days: 3,
      travelers: 1,
      budgetTier: "Budget",
      budgetAmount: 15000,
      styles: ["History", "Culture"],
    });

    const generated = await caller.travel.generateItinerary(input);

    const created = await caller.travel.createTrip({
      ...input,
      title: "Jaipur Heritage Tour",
      summary: "A memorable 3-day exploration of Rajasthan's Pink City.",
      itinerary: generated.days,
      budget: {
        accommodation: 5000,
        food: 4000,
        transport: 3000,
        activities: 3000,
        total: 15000,
        dailyPerTraveler: 5000,
      },
      accommodation: null,
    });

    expect(created.id).toBeDefined();
    expect(typeof created.id).toBe("number");
  });
});
