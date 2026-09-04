import "server-only";

/**
 * True only for the live Production environment on Vercel (VERCEL_ENV is
 * set automatically by the platform: "production" | "preview" |
 * "development", and is unset entirely outside Vercel). Local dev and
 * Preview deployments are treated as demo-safe.
 */
export function isProductionEnvironment(): boolean {
  return process.env.VERCEL_ENV === "production";
}
