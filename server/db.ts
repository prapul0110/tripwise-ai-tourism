import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertTrip, InsertUser, subscriptions, travelProfiles, trips, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listTripsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trips).where(eq(trips.userId, userId)).orderBy(desc(trips.updatedAt));
}

export async function getTripForUser(userId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
  const trip = result[0];
  return trip?.userId === userId ? trip : undefined;
}

export async function createTripForUser(values: InsertTrip) {
  const db = await getDb();
  if (!db) throw new Error("Trip storage is temporarily unavailable");
  const result = await db.insert(trips).values(values);
  return Number(result[0].insertId);
}

export async function deleteTripForUser(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Trip storage is temporarily unavailable");
  const owned = await getTripForUser(userId, id);
  if (!owned) return false;
  await db.delete(trips).where(eq(trips.id, id));
  return true;
}

export async function getSubscriptionForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result[0];
}

export async function setSubscriptionForUser(userId: number, plan: "free" | "pro") {
  const db = await getDb();
  if (!db) throw new Error("Subscription storage is temporarily unavailable");
  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + 1);
  await db.insert(subscriptions).values({ userId, plan, status: "active", provider: "demo", renewalDate }).onDuplicateKeyUpdate({ set: { plan, status: "active", provider: "demo", renewalDate } });
  return getSubscriptionForUser(userId);
}

export async function getTravelProfileForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(travelProfiles).where(eq(travelProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function setTravelProfileForUser(userId: number, preferences: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Travel preferences are temporarily unavailable");
  await db.insert(travelProfiles).values({ userId, preferences }).onDuplicateKeyUpdate({ set: { preferences } });
  return getTravelProfileForUser(userId);
}
