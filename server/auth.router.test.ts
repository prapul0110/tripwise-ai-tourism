import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  val?: string;
  options: Record<string, unknown>;
};

function createMockContext(user = null as TrpcContext["user"]): {
  ctx: TrpcContext;
  cookiesSet: CookieCall[];
  cookiesCleared: CookieCall[];
} {
  const cookiesSet: CookieCall[] = [];
  const cookiesCleared: CookieCall[] = [];

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "http",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, val: string, options: Record<string, unknown>) => {
        cookiesSet.push({ name, val, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        cookiesCleared.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, cookiesSet, cookiesCleared };
}

describe("auth router procedures", () => {
  it("me returns null when unauthenticated", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).toBeNull();
  });

  it("me returns current user when authenticated", async () => {
    const mockUser = {
      id: 42,
      openId: "usr_test42",
      email: "traveller@tripwise.in",
      name: "Rohan V",
      passwordHash: "hash123",
      loginMethod: "password",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const { ctx } = createMockContext(mockUser);
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).not.toBeNull();
    expect(me?.email).toBe("traveller@tripwise.in");
    expect(me?.name).toBe("Rohan V");
  });

  it("logout clears the session cookie and returns success", async () => {
    const { ctx, cookiesCleared } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(cookiesCleared).toHaveLength(1);
    expect(cookiesCleared[0]?.name).toBe(COOKIE_NAME);
    expect(cookiesCleared[0]?.options).toMatchObject({
      maxAge: -1,
      httpOnly: true,
      path: "/",
    });
  });

  it("register rejects invalid email formats", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        email: "not-an-email",
        password: "securePassword123",
      })
    ).rejects.toThrow();
  });

  it("register rejects passwords shorter than 8 characters", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        email: "valid@example.com",
        password: "1234567", // 7 characters, below 8
      })
    ).rejects.toThrow("Password must be at least 8 characters");
  });

  it("login rejects empty passwords", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "valid@example.com",
        password: "",
      })
    ).rejects.toThrow();
  });
});
