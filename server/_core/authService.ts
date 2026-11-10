import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

export type SessionPayload = {
  userId: number;
  openId: string;
  email: string;
};

function getSessionSecret() {
  if (ENV.isProduction && !ENV.cookieSecret) {
    throw new Error("Missing required JWT_SECRET environment variable in production.");
  }
  const secret = ENV.cookieSecret || "tripwise-fallback-secret-for-dev-32chars";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  user: { id: number; openId: string; email: string | null },
  options: { expiresInMs?: number } = {}
): Promise<string> {
  const issuedAt = Date.now();
  const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
  const secretKey = getSessionSecret();

  return new SignJWT({
    userId: user.id,
    openId: user.openId,
    email: user.email ?? "",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<{ userId?: number; openId?: string } | null> {
  if (!token) return null;

  try {
    const secretKey = getSessionSecret();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    const userId = typeof payload.userId === "number" ? payload.userId : undefined;
    const openId = typeof payload.openId === "string" ? payload.openId : undefined;

    if (!userId && !openId) return null;

    return { userId, openId };
  } catch (error) {
    return null;
  }
}

export async function authenticateRequest(req: Request): Promise<User | null> {
  const cookieHeader = req.headers.cookie;
  const parsedCookies = cookieHeader ? parseCookieHeader(cookieHeader) : {};
  let sessionToken = parsedCookies[COOKIE_NAME];

  if (!sessionToken) {
    const authHeader = req.headers.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      sessionToken = authHeader.slice(7);
    }
  }

  const session = await verifySessionToken(sessionToken);
  if (!session) return null;

  if (session.userId) {
    const user = await db.getUserById(session.userId);
    if (user) return user;
  }

  if (session.openId) {
    const user = await db.getUserByOpenId(session.openId);
    if (user) return user;
  }

  return null;
}
