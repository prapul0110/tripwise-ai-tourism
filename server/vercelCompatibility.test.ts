import { describe, expect, it } from "vitest";
import { EventEmitter } from "events";
import type { Express } from "express";
import { createTripWiseApp, extractValidatedApiPath, combinePathAndQuery } from "./_core/app";
import serverlessEntryHandler from "../serverless/entry";
import vercelIndexHandler from "../api/index";
import { createSessionToken } from "./_core/authService";
import { ENV } from "./_core/env";

function executeMockRequest(
  app: Express,
  method: string,
  url: string,
  options: {
    body?: any;
    headers?: Record<string, string>;
    originalUrl?: string;
  } = {}
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve) => {
    const req = new EventEmitter() as any;
    req.method = method;
    req.url = url;
    req.connection = { encrypted: false };
    req.socket = { encrypted: false };
    if (options.originalUrl) {
      req.originalUrl = options.originalUrl;
    }
    req.headers = { host: "localhost", ...(options.headers || {}) };
    req.query = {};
    req.params = {};
    req.pipe = () => req;
    if (options.body !== undefined) {
      req.body = options.body;
      req.headers["content-type"] = "application/json";
    }

    const res = new EventEmitter() as any;
    let statusCode = 200;
    const headers: Record<string, string> = {};
    let responseBody = "";

    res.statusCode = 200;
    res.setHeader = (name: string, val: string) => {
      headers[name.toLowerCase()] = String(val);
    };
    res.getHeader = (name: string) => headers[name.toLowerCase()];
    res.cookie = (name: string, val: string) => {
      headers["set-cookie"] = `${name}=${val}`;
    };
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
    const appendChunk = (chunk: any) => {
      if (!chunk) return;
      if (typeof chunk === "string") {
        responseBody += chunk;
      } else if (Buffer.isBuffer(chunk) || chunk instanceof Uint8Array || Array.isArray(chunk)) {
        responseBody += Buffer.from(chunk).toString("utf-8");
      } else {
        responseBody += String(chunk);
      }
    };

    res.write = (chunk: any) => {
      appendChunk(chunk);
      return true;
    };
    res.end = (chunk?: any) => {
      appendChunk(chunk);
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

  it("exports a default Express app from serverless/entry.ts without opening a TCP listener", () => {
    expect(serverlessEntryHandler).toBeDefined();
    expect(typeof serverlessEntryHandler.use).toBe("function");
    expect((serverlessEntryHandler as unknown as { listening?: boolean }).listening).toBeFalsy();
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

  describe("Path Normalization & Safe Path Recovery", () => {
    it("validates candidate API paths strictly with extractValidatedApiPath", () => {
      // Valid cases
      expect(extractValidatedApiPath("/api/trpc/auth.register")).toBe("/api/trpc/auth.register");
      expect(extractValidatedApiPath("/api/trpc/auth.me?batch=1")).toBe("/api/trpc/auth.me?batch=1");
      expect(extractValidatedApiPath("  /api/storage/uploads/img.png  ")).toBe("/api/storage/uploads/img.png");

      // Invalid: path traversal
      expect(extractValidatedApiPath("/api/../etc/passwd")).toBeNull();
      expect(extractValidatedApiPath("/api/v1/../../secret")).toBeNull();
      expect(extractValidatedApiPath("/api/test\\traversal")).toBeNull();

      // Invalid: external host / protocol-relative
      expect(extractValidatedApiPath("//evil.com/api/trpc")).toBeNull();
      expect(extractValidatedApiPath("https://evil.com/api/trpc")).toBeNull();
      expect(extractValidatedApiPath("http://evil.com/api/trpc")).toBeNull();

      // Invalid: non-api paths
      expect(extractValidatedApiPath("/admin/users")).toBeNull();
      expect(extractValidatedApiPath("/")).toBeNull();
      expect(extractValidatedApiPath("")).toBeNull();
      expect(extractValidatedApiPath(null)).toBeNull();
      expect(extractValidatedApiPath(undefined)).toBeNull();
      expect(extractValidatedApiPath(123 as any)).toBeNull();
    });

    it("preserves and merges query strings correctly with combinePathAndQuery", () => {
      // Candidate without query, req with query
      expect(
        combinePathAndQuery("/api/trpc/auth.register", "/api/index?batch=1")
      ).toBe("/api/trpc/auth.register?batch=1");

      // Multiple query parameters preserved
      expect(
        combinePathAndQuery("/api/trpc/auth.me", "/api/index?batch=1&input=%7B%7D")
      ).toBe("/api/trpc/auth.me?batch=1&input=%7B%7D");

      // Candidate already contains query string
      expect(
        combinePathAndQuery("/api/trpc/auth.register?batch=1", "/api/index")
      ).toBe("/api/trpc/auth.register?batch=1");

      // Both have distinct params: merge
      expect(
        combinePathAndQuery("/api/trpc/auth.me?test=true", "/api/index?batch=1")
      ).toBe("/api/trpc/auth.me?test=true&batch=1");

      // Neither has query string
      expect(
        combinePathAndQuery("/api/trpc/auth.register", "/api/index")
      ).toBe("/api/trpc/auth.register");
    });

    it("ensures ordinary local development requests are never modified", () => {
      const app = createTripWiseApp();
      const localReq = {
        url: "/api/trpc/travel.listTrips?batch=1&input=%7B%7D",
        method: "GET",
        headers: { host: "localhost:3000" },
      } as any;
      let nextCalled = false;

      const normalizer = (app as any)._router.stack.find((layer: any) =>
        layer.name === "<anonymous>" && !layer.route
      );

      normalizer.handle(localReq, {} as any, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
      expect(localReq.url).toBe("/api/trpc/travel.listTrips?batch=1&input=%7B%7D");
    });

    it("ensures non-API requests are not modified by normalizer", () => {
      const app = createTripWiseApp();
      const nonApiReq = {
        url: "/destinations/paris",
        method: "GET",
        headers: { host: "localhost:3000" },
      } as any;
      let nextCalled = false;

      const normalizer = (app as any)._router.stack.find((layer: any) =>
        layer.name === "<anonymous>" && !layer.route
      );

      normalizer.handle(nonApiReq, {} as any, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
      expect(nonApiReq.url).toBe("/destinations/paris");
    });

    it("safely recovers original path from Vercel x-matched-path header on rewritten /api/index", () => {
      const app = createTripWiseApp();
      const rewrittenReq = {
        url: "/api/index?batch=1",
        method: "POST",
        headers: {
          host: "tripwise-ai-tourism.vercel.app",
          "x-matched-path": "/api/trpc/auth.register",
        },
      } as any;
      let nextCalled = false;

      const normalizer = (app as any)._router.stack.find((layer: any) =>
        layer.name === "<anonymous>" && !layer.route
      );

      normalizer.handle(rewrittenReq, {} as any, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
      expect(rewrittenReq.url).toBe("/api/trpc/auth.register?batch=1");
    });

    it("rejects invalid or missing forwarded-path headers and leaves req.url unmodified", () => {
      const app = createTripWiseApp();
      const normalizer = (app as any)._router.stack.find((layer: any) =>
        layer.name === "<anonymous>" && !layer.route
      );

      // Case A: Missing header
      const missingHeaderReq = {
        url: "/api/index?batch=1",
        method: "POST",
        headers: { host: "tripwise.vercel.app" },
      } as any;
      normalizer.handle(missingHeaderReq, {} as any, () => {});
      expect(missingHeaderReq.url).toBe("/api/index?batch=1");

      // Case B: Directory traversal attempt
      const traversalReq = {
        url: "/api/index?batch=1",
        method: "POST",
        headers: {
          host: "tripwise.vercel.app",
          "x-matched-path": "/api/../admin/users",
        },
      } as any;
      normalizer.handle(traversalReq, {} as any, () => {});
      expect(traversalReq.url).toBe("/api/index?batch=1");

      // Case C: Protocol-relative external domain
      const evilDomainReq = {
        url: "/api/index?batch=1",
        method: "POST",
        headers: {
          host: "tripwise.vercel.app",
          "x-matched-path": "//evil.com/api/trpc/auth.register",
        },
      } as any;
      normalizer.handle(evilDomainReq, {} as any, () => {});
      expect(evilDomainReq.url).toBe("/api/index?batch=1");

      // Case D: Arbitrary client headers are ignored
      const arbitraryHeaderReq = {
        url: "/api/index?batch=1",
        method: "POST",
        headers: {
          host: "tripwise.vercel.app",
          "x-forwarded-path": "/api/trpc/auth.register",
          "x-original-url": "/api/trpc/auth.register",
          "x-custom-rewrite": "/api/trpc/auth.register",
        },
      } as any;
      normalizer.handle(arbitraryHeaderReq, {} as any, () => {});
      expect(arbitraryHeaderReq.url).toBe("/api/index?batch=1");
    });
  });

  it("serves healthcheck response on /api, /api/health, and /api/index", async () => {
    const app = createTripWiseApp();

    const resApi = await executeMockRequest(app, "GET", "/api");
    expect(resApi.statusCode).toBe(200);
    const bodyApi = JSON.parse(resApi.body);
    expect(bodyApi.status).toBe("ok");
    expect(bodyApi.service).toBe("tripwise-api");

    const resHealth = await executeMockRequest(app, "GET", "/api/health");
    expect(resHealth.statusCode).toBe(200);
    const bodyHealth = JSON.parse(resHealth.body);
    expect(bodyHealth.status).toBe("ok");

    const resIndex = await executeMockRequest(app, "GET", "/api/index");
    expect(resIndex.statusCode).toBe(200);
    const bodyIndex = JSON.parse(resIndex.body);
    expect(bodyIndex.status).toBe("ok");
  });

  it("returns 404 JSON for unhandled /api endpoints without hanging", async () => {
    const app = createTripWiseApp();
    const res = await executeMockRequest(app, "GET", "/api/unknown-endpoint");
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.error).toBe("API endpoint not found");
  });

  it("routes tRPC query request via /api/trpc/auth.me", async () => {
    const app = createTripWiseApp();
    const res = await executeMockRequest(
      app,
      "GET",
      "/api/trpc/auth.me?batch=1&input=%7B%7D"
    );
    // Unauthenticated request returns 200 with result.data = null
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].result.data.json).toBeNull();
  });

  it("routes tRPC mutation request via /api/trpc/auth.register", async () => {
    const app = createTripWiseApp();
    const uniqueEmail = `test_vercel_${Date.now()}@example.com`;
    const res = await executeMockRequest(
      app,
      "POST",
      "/api/trpc/auth.register?batch=1",
      {
        headers: { "content-type": "application/json" },
        body: {
          0: {
            json: {
              name: "Vercel Test User",
              email: uniqueEmail,
              password: "Password123!",
            },
          },
        },
      }
    );
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].result.data.json.user).toBeDefined();
    expect(parsed[0].result.data.json.user.email).toBe(uniqueEmail);
  });

  it("routes tRPC mutation request via /api/trpc/auth.login", async () => {
    const app = createTripWiseApp();
    const uniqueEmail = `login_test_${Date.now()}@example.com`;
    // First register
    await executeMockRequest(
      app,
      "POST",
      "/api/trpc/auth.register?batch=1",
      {
        headers: { "content-type": "application/json" },
        body: {
          0: {
            json: {
              name: "Login Test User",
              email: uniqueEmail,
              password: "Password123!",
            },
          },
        },
      }
    );

    // Then login
    const res = await executeMockRequest(
      app,
      "POST",
      "/api/trpc/auth.login?batch=1",
      {
        headers: { "content-type": "application/json" },
        body: {
          0: {
            json: {
              email: uniqueEmail,
              password: "Password123!",
            },
          },
        },
      }
    );
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].result.data.json.user).toBeDefined();
    expect(parsed[0].result.data.json.user.email).toBe(uniqueEmail);
  });

  it("routes tRPC requests correctly when rewritten to /api/index with originalUrl", async () => {
    const app = createTripWiseApp();
    const res = await executeMockRequest(
      app,
      "GET",
      "/api/index",
      {
        originalUrl: "/api/trpc/auth.me?batch=1&input=%7B%7D",
      }
    );
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].result.data.json).toBeNull();
  });

  it("routes tRPC mutation via rewritten /api/index with verified x-matched-path header", async () => {
    const app = createTripWiseApp();
    const uniqueEmail = `matched_path_test_${Date.now()}@example.com`;
    const res = await executeMockRequest(
      app,
      "POST",
      "/api/index?batch=1",
      {
        headers: {
          "x-matched-path": "/api/trpc/auth.register",
          "content-type": "application/json",
        },
        body: {
          0: {
            json: {
              name: "Matched Path User",
              email: uniqueEmail,
              password: "Password123!",
            },
          },
        },
      }
    );
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].result.data.json.user).toBeDefined();
    expect(parsed[0].result.data.json.user.email).toBe(uniqueEmail);
  });

  it("preserves query strings completely when rewritten to /api/index with x-matched-path", async () => {
    const app = createTripWiseApp();
    const res = await executeMockRequest(
      app,
      "GET",
      "/api/index?batch=1&input=%7B%7D",
      {
        headers: {
          "x-matched-path": "/api/trpc/auth.me",
        },
      }
    );
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].result.data.json).toBeNull();
  });

  it("returns 404 for rewritten /api/index mutation if x-matched-path is missing or invalid", async () => {
    const app = createTripWiseApp();

    // Attempt mutation without x-matched-path
    const resMissing = await executeMockRequest(
      app,
      "POST",
      "/api/index?batch=1",
      {
        headers: { "content-type": "application/json" },
        body: { 0: { json: { email: "fake@example.com" } } },
      }
    );
    expect(resMissing.statusCode).toBe(404);
    expect(JSON.parse(resMissing.body).error).toBe("API endpoint not found");

    // Attempt mutation with path traversal
    const resTraversal = await executeMockRequest(
      app,
      "POST",
      "/api/index?batch=1",
      {
        headers: {
          "x-matched-path": "/api/../admin/drop-db",
          "content-type": "application/json",
        },
        body: { 0: { json: { email: "fake@example.com" } } },
      }
    );
    expect(resTraversal.statusCode).toBe(404);
    expect(JSON.parse(resTraversal.body).error).toBe("API endpoint not found");

    // Attempt mutation with arbitrary spoofed header
    const resSpoofed = await executeMockRequest(
      app,
      "POST",
      "/api/index?batch=1",
      {
        headers: {
          "x-forwarded-path": "/api/trpc/auth.register",
          "content-type": "application/json",
        },
        body: { 0: { json: { email: "fake@example.com" } } },
      }
    );
    expect(resSpoofed.statusCode).toBe(404);
    expect(JSON.parse(resSpoofed.body).error).toBe("API endpoint not found");
  });

  it("routes authenticated query travel.listTrips with registered user session cookie", async () => {
    const app = createTripWiseApp();
    const uniqueEmail = `trips_test_${Date.now()}@example.com`;
    const regRes = await executeMockRequest(
      app,
      "POST",
      "/api/trpc/auth.register?batch=1",
      {
        body: {
          0: {
            json: {
              name: "Trips Test User",
              email: uniqueEmail,
              password: "Password123!",
            },
          },
        },
      }
    );
    const setCookie = regRes.headers["set-cookie"];

    const res = await executeMockRequest(
      app,
      "GET",
      "/api/trpc/travel.listTrips?batch=1&input=%7B%7D",
      {
        headers: {
          cookie: setCookie,
        },
      }
    );
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(Array.isArray(parsed)).toBe(true);
    expect(Array.isArray(parsed[0].result.data.json)).toBe(true);
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
