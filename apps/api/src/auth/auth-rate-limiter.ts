import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";

interface Bucket {
  count: number;
  expiresAt: number;
}

@Injectable()
export class AuthRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private calls = 0;

  consume(action: string, clientKey: string, limit: number, windowMs: number): void {
    const key = createHash("sha256").update(`${action}\0${clientKey}`).digest("hex");
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || bucket.expiresAt <= now) {
      if (this.buckets.size >= 10_000) this.removeExpired(now);
      if (this.buckets.size >= 10_000 && !bucket) {
        throw new HttpException("Too many requests. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
      }
      bucket = { count: 0, expiresAt: now + windowMs };
      this.buckets.set(key, bucket);
    }
    if (bucket.count >= limit) {
      throw new HttpException("Too many requests. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
    }
    bucket.count += 1;

    this.calls += 1;
    if (this.calls % 256 === 0) this.removeExpired(now);
  }

  private removeExpired(now: number): void {
    for (const [bucketKey, entry] of this.buckets) {
      if (entry.expiresAt <= now) this.buckets.delete(bucketKey);
    }
  }
}

export function authRateLimitConfig(): { windowMs: number; signUp: number; signIn: number; reset: number; verify: number } {
  return {
    windowMs: positiveInteger(process.env.AUTH_RATE_WINDOW_SECONDS, 900) * 1_000,
    signUp: positiveInteger(process.env.AUTH_RATE_SIGNUP_LIMIT, 5),
    signIn: positiveInteger(process.env.AUTH_RATE_SIGNIN_LIMIT, 10),
    reset: positiveInteger(process.env.AUTH_RATE_RESET_LIMIT, 5),
    verify: positiveInteger(process.env.AUTH_RATE_VERIFY_LIMIT, 20),
  };
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
