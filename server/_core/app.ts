import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";

/**
 * Validates that a candidate path is a safe relative API path.
 * Must begin with "/api/", cannot start with "//", and cannot contain directory traversal.
 */
export function extractValidatedApiPath(candidate: unknown): string | null {
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  if (!trimmed.startsWith("/api/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("..") || trimmed.includes("\0") || trimmed.includes("\\")) return null;

  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (!parsed.pathname.startsWith("/api/")) return null;
    if (parsed.pathname.includes("..")) return null;
    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Combines a validated candidate path with the query string from the incoming request URL.
 */
export function combinePathAndQuery(candidatePath: string, originalReqUrl: string): string {
  const queryIndexInCandidate = candidatePath.indexOf("?");
  const queryIndexInReq = originalReqUrl.indexOf("?");

  if (queryIndexInCandidate !== -1) {
    if (queryIndexInReq === -1) {
      return candidatePath;
    }
    const candidateUrl = new URL(candidatePath, "http://localhost");
    const reqUrl = new URL(originalReqUrl, "http://localhost");
    reqUrl.searchParams.forEach((val, key) => {
      if (!candidateUrl.searchParams.has(key)) {
        candidateUrl.searchParams.append(key, val);
      }
    });
    return `${candidateUrl.pathname}${candidateUrl.search}`;
  }

  if (queryIndexInReq !== -1) {
    const queryString = originalReqUrl.slice(queryIndexInReq);
    return `${candidatePath}${queryString}`;
  }

  return candidatePath;
}

export function createTripWiseApp(): Express {
  const app = express();

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Storage proxy
  registerStorageProxy(app);

  // Path normalization:
  // 1. If incoming request already targets /api/trpc or /api/storage, keep it unchanged.
  // 2. If a serverless rewrite replaced req.url with /api or /api/index, safely resolve original path:
  //    Check documented Vercel routing header (x-matched-path) or verified req.originalUrl.
  // 3. If a serverless proxy stripped the /api prefix (e.g. /trpc/...), restore it.
  app.use((req, _res, next) => {
    const isRewrittenTarget =
      req.url === "/api" ||
      req.url === "/api/index" ||
      req.url.startsWith("/api?") ||
      req.url.startsWith("/api/index?");

    if (isRewrittenTarget) {
      // Check documented Vercel edge header x-matched-path
      const rawMatchedPath = Array.isArray(req.headers["x-matched-path"])
        ? req.headers["x-matched-path"][0]
        : req.headers["x-matched-path"];

      const matchedCandidate = extractValidatedApiPath(rawMatchedPath);

      // Or check if req.originalUrl was populated upstream differently from req.url
      const originalCandidate =
        req.originalUrl && req.originalUrl !== req.url
          ? extractValidatedApiPath(req.originalUrl)
          : null;

      const validCandidate = matchedCandidate || originalCandidate;

      if (validCandidate) {
        req.url = combinePathAndQuery(validCandidate, req.url);
      }
    }

    if (!req.url.startsWith("/api") && req.url.startsWith("/trpc")) {
      req.url = `/api${req.url}`;
    }

    next();
  });

  // Health check / API status endpoint
  app.get(["/api", "/api/health", "/api/index"], (_req, res) => {
    res.status(200).json({ status: "ok", service: "tripwise-api" });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Fallback for unhandled API endpoints to prevent serverless execution hanging
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  return app;
}
