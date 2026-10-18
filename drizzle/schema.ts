import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const trips = mysqlTable("trips", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  destination: varchar("destination", { length: 120 }).notNull(),
  startDate: varchar("startDate", { length: 10 }).notNull(),
  endDate: varchar("endDate", { length: 10 }).notNull(),
  days: int("days").notNull(),
  travelers: int("travelers").notNull(),
  budgetTier: mysqlEnum("budgetTier", ["Budget", "Moderate", "Premium", "Luxury"]).notNull(),
  budgetAmount: int("budgetAmount").notNull(),
  budgetBreakdown: json("budgetBreakdown").$type<{ accommodation: number; food: number; transport: number; activities: number; total: number; dailyPerTraveler: number }>(),
  styles: json("styles").$type<string[]>().notNull(),
  itinerary: json("itinerary").$type<unknown>().notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const travelProfiles = mysqlTable("travelProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  preferences: json("preferences").$type<string[]>().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  plan: mysqlEnum("plan", ["free", "pro"]).default("free").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "pending", "expired"]).default("active").notNull(),
  provider: varchar("provider", { length: 40 }).default("demo"),
  renewalDate: timestamp("renewalDate"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = typeof trips.$inferInsert;
