import "server-only";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

/**
 * Customer order-tracking tokens (Phase 9). Not derived from the order
 * number, not a password -- a plain high-entropy bearer credential whose
 * only job is "prove you're the browser that just placed this order."
 *
 * 256 bits of randomness, base64url-encoded so it's URL-safe with no
 * padding characters to escape. Generated once, server-side, at order
 * creation, and returned to that same browser exactly once. Only its
 * SHA-256 hash is ever persisted (Order.trackingTokenHash) -- if the
 * database were ever read by someone who shouldn't have access, they'd
 * gain nothing usable from the hash alone, same principle as password
 * hashing even though this isn't a password.
 */
export function generateTrackingToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashTrackingToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// A real hash of a fixed, non-secret placeholder -- used to keep timing
// constant when there's no real hash to compare against (order not found,
// or has no tracking token at all), mirroring the same timing-safety
// pattern already used for admin login (see app/api/admin/login/route.ts).
const DUMMY_HASH = hashTrackingToken("no-such-order-tracking-token-placeholder");

/**
 * Constant-time verification. Always performs a real comparison (against
 * the real hash if one exists, otherwise against a dummy hash of the same
 * length) so response timing can never reveal whether an order number
 * exists independently of whether the token was right.
 */
export function verifyTrackingToken(token: string | undefined, storedHash: string | null | undefined): boolean {
  const candidate = hashTrackingToken(token ?? "");
  const reference = storedHash ?? DUMMY_HASH;
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(reference, "hex");
  if (a.length !== b.length) return false;
  const matches = timingSafeEqual(a, b);
  // Only a genuine stored hash can ever result in success -- comparing
  // against the dummy always fails even on a byte-for-byte match, since a
  // null/missing order should never be "accessible."
  return matches && storedHash != null;
}
