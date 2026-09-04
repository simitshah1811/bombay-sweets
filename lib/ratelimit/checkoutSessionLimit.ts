import "server-only";
import { prisma } from "@/lib/db";

/**
 * Database-backed, serverless-safe rate limiting for Stripe Checkout
 * Session creation (Phase 9 hardening). An in-memory counter would NOT
 * work correctly here -- each Vercel serverless invocation can land on a
 * different function instance with its own memory, so a per-process
 * counter would undercount and let abuse through. Postgres (already the
 * single shared source of truth for everything else in this system) gives
 * every instance a consistent view for free, with no new infrastructure
 * (Redis, an external rate-limit service) needed for this scale.
 *
 * Algorithm: fixed window. Each request's window is `now` floored to the
 * nearest WINDOW_MS boundary; a (key, windowStart) row is atomically
 * upserted-and-incremented via Postgres's own unique-constraint handling,
 * which is what makes this race-safe across concurrent/parallel requests
 * without any application-level locking. Fixed windows can allow a short
 * burst right at a window boundary (double the limit across two adjacent
 * windows in the worst case) -- an accepted, documented tradeoff; a
 * sliding-window or token-bucket algorithm would close that gap at the
 * cost of real complexity this threat model doesn't warrant.
 */
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 20;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export async function checkCheckoutSessionRateLimit(identifier: string): Promise<RateLimitResult> {
  const windowStartMs = Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS;
  const windowStart = new Date(windowStartMs);
  const key = `checkout-session:${identifier}`;

  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });

  if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfterMs = windowStartMs + WINDOW_MS - Date.now();
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  return { allowed: true };
}

/** Best-effort client identifier for a Vercel/serverless deployment. */
export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // The first entry is the original client; anything after that was
    // appended by intermediate proxies.
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  // Local dev / no proxy headers present -- a single shared bucket is
  // fine here since it only affects this one developer's own testing.
  return "unknown";
}
