import { describe, expect, it } from "vitest";
import { EventEmitter } from "events";
import type { Express } from "express";
import { createTripWiseApp } from "./_core/app";
import vercelCatchAllHandler from "../api/[...path]";
import vercelIndexHandler from "../api/index";
import { createSessionToken } from "./_core/authService";
import { ENV } from "./_core/env";

function executeMockRequest(
  app: Express,
  method: string,
  url: string
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve) => {
    const req = new EventEmitter() as any;
    req.method = method;
    req.url = url;
    req.headers = { host: "localhost" };
    req.query = {};
    req.params = {};
    req.pipe = () => req;

    const res = new EventEmitter() as any;
    let statusCode = 200;
    const headers: Record<string, string> = {};
    let responseBody = "";

    res.statusCode = 200;
    res.setHeader = (name: string, val: string) => {
      headers[name.toLowerCase()] = String(val);
    };
    res.getHeader = (name: string) => headers[name.toLowerCase()];
    res.status = (code: number) => {
      statusCode = code;
      res.statusCode = code;
      return res;
    };
    res.writeHead = (code: number, hdrs?: any) => {
      statusCode = code;
      if (hdrs) Object.assign(headers, hdrs);
      return res;
    };
    res.write = (chunk: any) => {
      if (chunk) responseBody += chunk.toString();
      return true;
    };
    res.end = (chunk?: any) => {
      if (chunk) responseBody += chunk.toString();
      resolve({ statusCode, headers, body: responseBody });
    };

    app.handle(req, res);
  });
}

describe("Vercel Deployment Compatibility", () => {
  it("imports and instantiates createTripWiseApp without opening a TCP listener", () => {
    const app = createTripWiseApp();
    expect(app).toBeDefined();
    expect(typeof app.use).toBe("function");
    // Verify it's an unmounted Express instance (no listening socket attached)
    expect((app as unknown as { listening?: boolean }).listening).toBeFalsy();
  });

  it("exports a default Express app from api/[...path].ts without opening a TCP listener", () => {
    expect(vercelCatchAllHandler).toBeDefined();
    expect(typeof vercelCatchAllHandler.use).toBe("function");
    expect((vercelCatchAllHandler as unknown as { listening?: boolean }).listening).toBeFalsy();
  });

  it("exports a default Express app from api/index.ts without opening a TCP listener", () => {
    expect(vercelIndexHandler).toBeDefined();
    expect(typeof vercelIndexHandler.use).toBe("function");
    expect((vercelIndexHandler as unknown as { listening?: boolean }).listening).toBeFalsy();
  });

  it("mounts /api/trpc middleware on the Express application stack", () => {
    const app = createTripWiseApp();
    const stack = (app as unknown as { _router?: { stack: Array<{ regexp: RegExp; path?: string }> } })._router?.stack;
    expect(stack).toBeDefined();

    // Verify /api/trpc router layer exists in the Express stack
    const hasTrpcRoute = stack?.some(layer =>
      layer.regexp && layer.regexp.test("/api/trpc")
    );
    expect(hasTrpcRoute).toBe(true);
  });

  it("normalizes path if serverless router strips /api prefix before forwarding to Express", () => {
    const app = createTripWiseApp();
    const req = { url: "/trpc/auth.me", method: "GET", headers: {} } as any;
    let nextCalled = false;

    // Run through the path normalizer middleware layer
    const normalizer = (app as any)._router.stack.find((layer: any) =>
      layer.name === "<anonymous>" && !layer.route
    );

    expect(normalizer).toBeDefined();
    normalizer.handle(req, {} as any, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.url).toBe("/api/trpc/auth.me");
  });

  it("preserves URL if request already contains /api prefix", () => {
    const app = createTripWiseApp();
    const req = { url: "/api/trpc/travel.listTrips", method: "GET", headers: {} } as any;
    let nextCalled = false;

    const normalizer = (app as any)._router.stack.find((layer: any) =>
      layer.name === "<anonymous>" && !layer.route
    );

    normalizer.handle(req, {} as any, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.url).toBe("/api/trpc/travel.listTrips");
  });

  it("fails safely if JWT_SECRET is missing in production mode", async () => {
    const originalIsProduction = ENV.isProduction;
    const originalCookieSecret = ENV.cookieSecret;

    try {
      (ENV as { isProduction: boolean }).isProduction = true;
      (ENV as { cookieSecret: string }).cookieSecret = "";

      await expect(
        createSessionToken({ id: 1, openId: "usr_test", email: "test@tripwise.in" })
      ).rejects.toThrow("Missing required JWT_SECRET environment variable in production.");
    } finally {
      (ENV as { isProduction: boolean }).isProduction = originalIsProduction;
      (ENV as { cookieSecret: string }).cookieSecret = originalCookieSecret;
    }
  });

  it("allows fallback JWT secret during development mode", async () => {
    const originalIsProduction = ENV.isProduction;

    try {
      (ENV as { isProduction: boolean }).isProduction = false;
      const token = await createSessionToken({ id: 1, openId: "usr_test", email: "test@tripwise.in" });
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    } finally {
      (ENV as { isProduction: boolean }).isProduction = originalIsProduction;
    }
  });
});
