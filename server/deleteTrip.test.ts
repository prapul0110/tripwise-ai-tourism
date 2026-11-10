import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { TRPCError } from "@trpc/server";
import {
  createTripForUser,
  deleteTripForUser,
  getTripForUser,
  isConnectivityError,
} from "./db";
import { ENV } from "./_core/env";

function createMockContext(userId: number, email = `traveler${userId}@tripwise.in`): TrpcContext {
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

describe("Saved Trip Deletion — End-to-End & Resilience", () => {
  const user1Ctx = createMockContext(301);
  const user2Ctx = createMockContext(302);
  const callerUser1 = appRouter.createCaller(user1Ctx);
  const callerUser2 = appRouter.createCaller(user2Ctx);

  const sampleTripData = {
    title: "Varanasi Spiritual Odyssey",
    summary: "Three serene days exploring the Ghats of Varanasi.",
    destination: "Varanasi",
    startDate: "2026-11-15",
    endDate: "2026-11-18",
    days: 3,
    travelers: 2,
    budgetTier: "Moderate" as const,
    budgetAmount: 25000,
    budgetBreakdown: {
      accommodation: 10000,
      food: 5500,
      activities: 4750,
      transport: 4750,
      total: 25000,
      dailyPerTraveler: 4166,
    },
    styles: ["Culture", "Spiritual"],
    itinerary: [
      {
        day: 1,
        theme: "Ghats & Ceremonies",
        stops: [
          {
            id: "stop-dashashwamedh-1",
            title: "Dashashwamedh Ghat Ganga Aarti",
            time: "18:30",
            location: "Dashashwamedh Ghat",
            description: "Spiritual evening lamps on the sacred Ganges.",
            duration: "2 hours",
            estimatedCost: 200,
            stopType: "attraction" as const,
            coords: { lat: 25.3076, lng: 83.0107 },
          },
        ],
      },
    ],
  };

  it("1. Successful deletion of an owned trip via tRPC caller", async () => {
    // User 1 creates a trip
    const tripId = await createTripForUser({
      ...sampleTripData,
      userId: 301,
    });
    expect(tripId).toBeGreaterThan(0);

    // Verify trip exists in list
    const beforeList = await callerUser1.travel.listTrips();
    expect(beforeList.some((t) => t.id === tripId)).toBe(true);

    // Delete trip via tRPC
    const result = await callerUser1.travel.deleteTrip({ id: tripId });
    expect(result).toEqual({ success: true });

    // Verify trip no longer exists in list
    const afterList = await callerUser1.travel.listTrips();
    expect(afterList.some((t) => t.id === tripId)).toBe(false);

    // Verify getTrip returns undefined/null
    const fetched = await getTripForUser(301, tripId);
    expect(fetched).toBeUndefined();
  });

  it("2. Cannot delete another user's trip (returns NOT_FOUND)", async () => {
    // User 1 creates a trip
    const user1TripId = await createTripForUser({
      ...sampleTripData,
      userId: 301,
      title: "User 1 Exclusive Trip",
    });

    // User 2 attempts to delete User 1's trip
    await expect(callerUser2.travel.deleteTrip({ id: user1TripId })).rejects.toThrow(
      TRPCError
    );

    try {
      await callerUser2.travel.deleteTrip({ id: user1TripId });
    } catch (err) {
      expect(err).toBeInstanceOf(TRPCError);
      expect((err as TRPCError).code).toBe("NOT_FOUND");
    }

    // Verify trip still exists for User 1
    const user1Trip = await getTripForUser(301, user1TripId);
    expect(user1Trip).toBeDefined();
    expect(user1Trip?.id).toBe(user1TripId);
  });

  it("3. Non-existent trip returns NOT_FOUND", async () => {
    const nonExistentId = 9999999;
    await expect(callerUser1.travel.deleteTrip({ id: nonExistentId })).rejects.toThrow(
      TRPCError
    );

    try {
      await callerUser1.travel.deleteTrip({ id: nonExistentId });
    } catch (err) {
      expect(err).toBeInstanceOf(TRPCError);
      expect((err as TRPCError).code).toBe("NOT_FOUND");
    }
  });

  it("4. Unauthenticated deletion returns UNAUTHORIZED", async () => {
    const unauthenticatedCtx: TrpcContext = {
      user: null,
      req: { protocol: "http", headers: {} } as TrpcContext["req"],
      res: { cookie: () => {}, clearCookie: () => {} } as unknown as TrpcContext["res"],
    };
    const unauthCaller = appRouter.createCaller(unauthenticatedCtx);

    await expect(unauthCaller.travel.deleteTrip({ id: 123 })).rejects.toThrow(TRPCError);

    try {
      await unauthCaller.travel.deleteTrip({ id: 123 });
    } catch (err) {
      expect(err).toBeInstanceOf(TRPCError);
      expect((err as TRPCError).code).toBe("UNAUTHORIZED");
    }
  });

  it("5. isConnectivityError correctly detects MySQL connection failures", () => {
    expect(isConnectivityError({ code: "ECONNREFUSED" })).toBe(true);
    expect(isConnectivityError({ code: "ETIMEDOUT" })).toBe(true);
    expect(isConnectivityError({ code: "ENOTFOUND" })).toBe(true);
    expect(isConnectivityError({ code: "EHOSTUNREACH" })).toBe(true);
    expect(isConnectivityError({ code: "PROTOCOL_CONNECTION_LOST" })).toBe(true);
    expect(isConnectivityError({ message: "connect ECONNREFUSED 127.0.0.1:3306" })).toBe(true);

    // Non-connectivity SQL or runtime errors must NOT be classified as connectivity errors
    expect(isConnectivityError({ code: "ER_PARSE_ERROR" })).toBe(false);
    expect(isConnectivityError({ code: "ER_NO_SUCH_TABLE" })).toBe(false);
    expect(isConnectivityError(new Error("Column not found"))).toBe(false);
    expect(isConnectivityError(null)).toBe(false);
    expect(isConnectivityError(undefined)).toBe(false);
  });

  it("6. In production, database errors are propagated rather than reporting success", async () => {
    // Create a trip in development mode first
    const tripId = await createTripForUser({
      ...sampleTripData,
      userId: 301,
      title: "Production Error Test Trip",
    });
    expect(tripId).toBeGreaterThan(0);

    const originalEnv = ENV.isProduction;
    try {
      // Switch environment to production mode
      (ENV as { isProduction: boolean }).isProduction = true;

      // In production mode, if the database connection fails, deleteTripForUser must propagate the error
      await expect(deleteTripForUser(301, tripId)).rejects.toThrow();
    } finally {
      (ENV as { isProduction: boolean }).isProduction = originalEnv;
    }
  });

  it("7. Development memory fallback works seamlessly when MySQL is unavailable", async () => {
    const originalEnv = ENV.isProduction;
    (ENV as { isProduction: boolean }).isProduction = false;

    try {
      // In development mode, saving and deleting trips succeeds even without a running MySQL instance
      const tripId = await createTripForUser({
        ...sampleTripData,
        userId: 301,
        title: "Development Resilient Trip",
      });

      const owned = await getTripForUser(301, tripId);
      expect(owned).toBeDefined();

      const deleted = await deleteTripForUser(301, tripId);
      expect(deleted).toBe(true);

      const afterDelete = await getTripForUser(301, tripId);
      expect(afterDelete).toBeUndefined();
    } finally {
      (ENV as { isProduction: boolean }).isProduction = originalEnv;
    }
  });
});
