import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertTrip, InsertUser, Trip, User, subscriptions, travelProfiles, trips, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
const _memUsers = new Map<number, User>();
let _memUserIdSeq = 1;
const _memTrips = new Map<number, Trip>();
let _memTripIdSeq = 100;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      if (ENV.isProduction) {
        throw new Error("[Database] Failed to connect to database in production.");
      }
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

export async function getUserByEmail(email: string) {
  const norm = email.toLowerCase().trim();
  const db = await getDb();
  if (!db) {
    if (ENV.isProduction) throw new Error("Database is temporarily unavailable");
    return Array.from(_memUsers.values()).find(u => u.email?.toLowerCase().trim() === norm);
  }

  try {
    const result = await db.select().from(users).where(eq(users.email, norm)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (err) {
    if (ENV.isProduction) throw err;
    return Array.from(_memUsers.values()).find(u => u.email?.toLowerCase().trim() === norm);
  }
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    if (ENV.isProduction) throw new Error("Database is temporarily unavailable");
    return _memUsers.get(id);
  }

  try {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (err) {
    if (ENV.isProduction) throw err;
    return _memUsers.get(id);
  }
}

export async function createUserWithPassword(data: { email: string; passwordHash: string; name?: string }): Promise<number> {
  const db = await getDb();
  const normalizedEmail = data.email.toLowerCase().trim();
  const openId = `usr_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const role = openId === ENV.ownerOpenId ? "admin" : "user";
  const now = new Date();

  if (!db) {
    if (ENV.isProduction) throw new Error("Database is temporarily unavailable in production");
    const id = ++_memUserIdSeq;
    const user: User = {
      id,
      openId,
      email: normalizedEmail,
      name: data.name?.trim() || null,
      passwordHash: data.passwordHash,
      loginMethod: "password",
      role,
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };
    _memUsers.set(id, user);
    return id;
  }

  try {
    const result = await db.insert(users).values({
      openId,
      email: normalizedEmail,
      name: data.name?.trim() || null,
      passwordHash: data.passwordHash,
      loginMethod: "password",
      role,
      lastSignedIn: now,
    });
    return Number(result[0].insertId);
  } catch (err) {
    if (ENV.isProduction) throw err;
    const id = ++_memUserIdSeq;
    const user: User = {
      id,
      openId,
      email: normalizedEmail,
      name: data.name?.trim() || null,
      passwordHash: data.passwordHash,
      loginMethod: "password",
      role,
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };
    _memUsers.set(id, user);
    return id;
  }
}

export async function updateLastSignedIn(id: number) {
  const db = await getDb();
  const now = new Date();
  if (!db) {
    const u = _memUsers.get(id);
    if (u) u.lastSignedIn = now;
    return;
  }
  try {
    await db.update(users).set({ lastSignedIn: now }).where(eq(users.id, id));
  } catch (err) {
    if (ENV.isProduction) throw err;
    const u = _memUsers.get(id);
    if (u) u.lastSignedIn = now;
  }
}

export async function listTripsForUser(userId: number) {
  const db = await getDb();
  if (!db) {
    if (ENV.isProduction) throw new Error("Database storage is unavailable in production");
    return Array.from(_memTrips.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  try {
    return await db.select().from(trips).where(eq(trips.userId, userId)).orderBy(desc(trips.updatedAt));
  } catch (err) {
    if (ENV.isProduction) throw err;
    return Array.from(_memTrips.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
}

export async function getTripForUser(userId: number, id: number) {
  const db = await getDb();
  if (!db) {
    if (ENV.isProduction) throw new Error("Database storage is unavailable in production");
    const mem = _memTrips.get(id);
    return mem && mem.userId === userId ? mem : undefined;
  }
  try {
    const result = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
    const trip = result[0];
    return trip?.userId === userId ? trip : undefined;
  } catch (err) {
    if (ENV.isProduction) throw err;
    const mem = _memTrips.get(id);
    return mem && mem.userId === userId ? mem : undefined;
  }
}

export async function createTripForUser(values: InsertTrip) {
  const db = await getDb();
  if (ENV.isProduction && !db) {
    throw new Error("Trip storage is unavailable in production");
  }
  if (!db) {
    const id = ++_memTripIdSeq;
    const now = new Date();
    const record: Trip = {
      id,
      userId: values.userId,
      title: values.title,
      destination: values.destination,
      startDate: values.startDate,
      endDate: values.endDate,
      days: values.days,
      travelers: values.travelers,
      budgetTier: values.budgetTier,
      budgetAmount: values.budgetAmount,
      budgetBreakdown: values.budgetBreakdown ?? null,
      styles: values.styles as string[],
      itinerary: values.itinerary,
      summary: values.summary,
      accommodation: values.accommodation ?? null,
      createdAt: now,
      updatedAt: now,
    };
    _memTrips.set(id, record);
    return id;
  }

  try {
    const result = await db.insert(trips).values(values);
    return Number(result[0].insertId);
  } catch (err) {
    if (ENV.isProduction) throw err;
    const id = ++_memTripIdSeq;
    const now = new Date();
    const record: Trip = {
      id,
      userId: values.userId,
      title: values.title,
      destination: values.destination,
      startDate: values.startDate,
      endDate: values.endDate,
      days: values.days,
      travelers: values.travelers,
      budgetTier: values.budgetTier,
      budgetAmount: values.budgetAmount,
      budgetBreakdown: values.budgetBreakdown ?? null,
      styles: values.styles as string[],
      itinerary: values.itinerary,
      summary: values.summary,
      accommodation: values.accommodation ?? null,
      createdAt: now,
      updatedAt: now,
    };
    _memTrips.set(id, record);
    return id;
  }
}

export async function updateTripForUser(
  userId: number,
  id: number,
  data: {
    itinerary: unknown;
    title?: string;
    summary?: string;
    budgetBreakdown?: unknown;
    accommodation?: unknown;
  }
): Promise<boolean> {
  const db = await getDb();
  const owned = await getTripForUser(userId, id);
  if (!owned) return false;

  if (!db) {
    const existing = _memTrips.get(id);
    if (!existing || existing.userId !== userId) return false;
    const updated: Trip = {
      ...existing,
      itinerary: data.itinerary,
      title: data.title !== undefined ? data.title : existing.title,
      summary: data.summary !== undefined ? data.summary : existing.summary,
      budgetBreakdown: (data.budgetBreakdown as Trip["budgetBreakdown"]) ?? existing.budgetBreakdown,
      accommodation: data.accommodation !== undefined ? data.accommodation : existing.accommodation,
      updatedAt: new Date(),
    };
    _memTrips.set(id, updated);
    return true;
  }

  const updateSet: Record<string, unknown> = {
    itinerary: data.itinerary,
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateSet.title = data.title;
  if (data.summary !== undefined) updateSet.summary = data.summary;
  if (data.budgetBreakdown !== undefined) updateSet.budgetBreakdown = data.budgetBreakdown;
  if (data.accommodation !== undefined) updateSet.accommodation = data.accommodation;

  await db.update(trips).set(updateSet).where(eq(trips.id, id));
  return true;
}

export function isConnectivityError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const error = err as { code?: string; errno?: number; syscall?: string; message?: string };
  const connCodes = [
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ENOTFOUND",
    "EHOSTUNREACH",
    "ECONNRESET",
    "PROTOCOL_CONNECTION_LOST",
    "ER_ACCESS_DENIED_ERROR",
    "ER_BAD_DB_ERROR",
    "ER_DBACCESS_DENIED_ERROR",
  ];
  if (error.code && connCodes.includes(error.code)) return true;
  if (error.message && /connect ECONNREFUSED|connection lost|ETIMEDOUT|ENOTFOUND|connect ETIMEDOUT|ECONNRESET/i.test(error.message)) return true;
  return false;
}

export async function deleteTripForUser(userId: number, id: number) {
  const db = await getDb();
  const owned = await getTripForUser(userId, id);
  if (!owned) return false;

  if (!db) {
    if (ENV.isProduction) {
      throw new Error("Database storage is unavailable in production");
    }
    _memTrips.delete(id);
    return true;
  }

  try {
    await db.delete(trips).where(eq(trips.id, id));
    _memTrips.delete(id);
    return true;
  } catch (err) {
    if (ENV.isProduction) throw err;
    if (isConnectivityError(err)) {
      _memTrips.delete(id);
      return true;
    }
    throw err;
  }
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
