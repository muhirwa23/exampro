import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AuthRateLimiter } from "./auth-rate-limiter.js";
import { readCookie } from "./auth.guard.js";
import {
  signInSchema,
  signUpSchema,
  tokenSchema,
  ZodBodyPipe,
} from "./auth.validation.js";

describe("auth input validation", () => {
  it("normalizes email and country while preserving a valid signup payload", () => {
    expect(signUpSchema.parse({
      email: "  Owner@Example.com ",
      name: "Owner",
      password: "strong-owner-password",
      organizationName: "Example Org",
      country: "rw",
    })).toEqual({
      email: "owner@example.com",
      name: "Owner",
      password: "strong-owner-password",
      organizationName: "Example Org",
      country: "RW",
    });
  });

  it("rejects weak passwords and unknown signup properties", () => {
    expect(signUpSchema.safeParse({
      email: "owner@example.com",
      name: "Owner",
      password: "short",
      organizationName: "Example Org",
    }).success).toBe(false);
    expect(signUpSchema.safeParse({
      email: "owner@example.com",
      name: "Owner",
      password: "strong-owner-password",
      organizationName: "Example Org",
      admin: true,
    }).success).toBe(false);
  });

  it("allows a nonempty legacy sign-in password so verification produces a generic credential error", () => {
    expect(signInSchema.parse({ email: "USER@example.com", password: "x" })).toEqual({
      email: "user@example.com",
      password: "x",
    });
  });

  it("requires opaque base64url auth tokens", () => {
    expect(tokenSchema.safeParse({ token: "A".repeat(43) }).success).toBe(true);
    expect(tokenSchema.safeParse({ token: "not a token" }).success).toBe(false);
  });

  it("does not include submitted secret values in validation errors", () => {
    const secret = "user-supplied-invalid-token-value";
    try {
      new ZodBodyPipe(tokenSchema).transform({ token: secret, extra: "secret" });
      throw new Error("Expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse();
      expect(JSON.stringify(response)).not.toContain(secret);
      expect(JSON.stringify(response)).not.toContain("secret");
    }
  });
});

describe("auth helpers", () => {
  it("parses only the named, URL-decoded session cookie", () => {
    expect(readCookie("other=x; trustexam_session=abc%2Fdef", "trustexam_session")).toBe("abc/def");
    expect(readCookie("trustexam_session=abc; trustexam_session=def", "trustexam_session")).toBe("abc");
    expect(readCookie("trustexam_session=%ZZ", "trustexam_session")).toBeUndefined();
    expect(readCookie(undefined, "trustexam_session")).toBeUndefined();
  });

  it("enforces the configured per-action request limit", () => {
    const limiter = new AuthRateLimiter();
    limiter.consume("signin", "127.0.0.1:user@example.com", 2, 60_000);
    limiter.consume("signin", "127.0.0.1:user@example.com", 2, 60_000);
    expect(() => limiter.consume("signin", "127.0.0.1:user@example.com", 2, 60_000)).toThrow();
    expect(() => limiter.consume("signup", "127.0.0.1:user@example.com", 2, 60_000)).not.toThrow();
  });
});
