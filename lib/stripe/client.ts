import "server-only";
import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Lazily constructed, not built at module-evaluation time -- Next's build
 * step ("Collecting page data") evaluates every route module's imports to
 * inspect their exports, even for routes that are otherwise fully dynamic.
 * Throwing at module scope broke `next build` itself whenever
 * STRIPE_SECRET_KEY isn't set in the environment doing the build (verified
 * -- this exact failure happened before this function existed). Calling
 * this only inside a request handler means a missing/misconfigured key
 * surfaces the moment a request actually tries to use Stripe, not before.
 */
export function getStripeClient(): Stripe {
  if (cached) return cached;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is missing. Add your Stripe TEST MODE secret key to your environment before using payments."
    );
  }

  // No pinned apiVersion -- the SDK defaults to its own compatible pinned
  // version rather than a hardcoded literal that could drift from what's
  // actually installed.
  cached = new Stripe(secretKey);
  return cached;
}
