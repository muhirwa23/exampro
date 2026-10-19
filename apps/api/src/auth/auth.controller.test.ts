import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthController } from "./auth.controller.js";
import { AuthRateLimiter } from "./auth-rate-limiter.js";
import { SESSION_COOKIE_NAME } from "./auth.guard.js";
import type { AuthService } from "./auth.service.js";
import type { AuthRequest, AuthResponse, AuthenticatedUser } from "./auth.types.js";

describe("AuthController", () => {
  afterEach(() => {
    delete process.env.AUTH_COOKIE_SECURE;
    delete process.env.AUTH_SESSION_TTL_SECONDS;
    vi.restoreAllMocks();
  });

  it("sets a secure HTTP-only SameSite=Lax cookie and never returns the raw session token", async () => {
    process.env.AUTH_COOKIE_SECURE = "true";
    const expiresAt = new Date(Date.now() + 60_000);
    const authService = {
      signIn: vi.fn().mockResolvedValue({
        token: "opaque-secret-session-token",
        expiresAt,
        user: { id: "user-1", email: "owner@example.com", name: "Owner", memberships: [] },
      }),
    } as unknown as AuthService;
    const controller = new AuthController(authService, new AuthRateLimiter());
    const response = { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as AuthResponse;
    const request = {
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
      headers: { "user-agent": "unit-test" },
    } as AuthRequest;

    const result = await controller.signIn({ email: "owner@example.com", password: "password" }, request, response);

    expect(result).toEqual({ user: { id: "user-1", email: "owner@example.com", name: "Owner", memberships: [] } });
    expect(JSON.stringify(result)).not.toContain("opaque-secret-session-token");
    expect(authService.signIn).toHaveBeenCalledWith("owner@example.com", "password", {
      ip: "127.0.0.1",
      userAgent: "unit-test",
    });
    expect(response.cookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, "opaque-secret-session-token", expect.objectContaining({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: expect.any(Number),
    }));
  });

  it("revokes the active session and clears its browser cookie on signout", async () => {
    const authService = { signOut: vi.fn().mockResolvedValue(undefined) } as unknown as AuthService;
    const controller = new AuthController(authService, new AuthRateLimiter());
    const response = { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as AuthResponse;
    const auth: AuthenticatedUser = {
      userId: "user-1",
      email: "owner@example.com",
      name: "Owner",
      sessionId: "session-1",
      memberships: [],
    };

    await controller.signOut(auth, response);

    expect(authService.signOut).toHaveBeenCalledWith("session-1", "user-1");
    expect(response.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
  });

  it("rate-limits verification resends by client address and email identity", async () => {
    const authService = { resendVerification: vi.fn().mockResolvedValue({ message: "accepted" }) } as unknown as AuthService;
    const rateLimiter = new AuthRateLimiter();
    const consume = vi.spyOn(rateLimiter, "consume");
    const controller = new AuthController(authService, rateLimiter);
    const request = {
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
      headers: {},
    } as AuthRequest;

    await controller.resendVerification({ email: "owner@example.com" }, request);

    expect(consume).toHaveBeenCalledWith("verify:ip", "127.0.0.1", expect.any(Number), expect.any(Number));
    expect(consume).toHaveBeenCalledWith("verify:identity", "owner@example.com", expect.any(Number), expect.any(Number));
    expect(authService.resendVerification).toHaveBeenCalledWith("owner@example.com");
  });
});
