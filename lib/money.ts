/**
 * Integer-cents money helpers for authoritative server-side pricing.
 *
 * JavaScript floats can't exactly represent most decimal fractions (e.g.
 * 19.99), so every authoritative calculation (subtotal, discount, tax,
 * total) is done in whole cents, not dollars. Values are converted to cents
 * exactly once at the boundary (reading a price out of the database or a
 * client "expected price" field), and back to dollars exactly once at the
 * boundary (writing a Prisma Decimal, or returning a JSON response).
 *
 * Rounding rule: every step that can produce a fraction of a cent
 * (percentage math) rounds immediately with `Math.round` (round-half-away-
 * from-zero) before the result is used in any further calculation -- errors
 * are never allowed to accumulate across multiple operations.
 */

/** Converts a DB Decimal (or any numeric/string dollar amount) to integer cents. */
export function toCents(amount: number | string | { toString(): string }): number {
  return Math.round(Number(amount.toString()) * 100);
}

/** Converts integer cents back to a dollar amount for display or DB storage. */
export function fromCents(cents: number): number {
  return cents / 100;
}

/** Applies a percentage to a cents amount, rounding to the nearest cent. */
export function applyPercentage(cents: number, percent: number): number {
  return Math.round((cents * percent) / 100);
}
