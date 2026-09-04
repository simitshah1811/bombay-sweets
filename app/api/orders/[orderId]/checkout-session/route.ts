import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getOrCreateCheckoutSession } from "@/lib/payments/checkoutSession";
import { checkCheckoutSessionRateLimit, getClientIdentifier } from "@/lib/ratelimit/checkoutSessionLimit";

const bodySchema = z.object({
  // The customer's own tracking token, threaded through only to build the
  // Stripe success_url/cancel_url -- never used to authorize this request
  // (see getOrCreateCheckoutSession's own doc comment).
  trackingToken: z.string().min(1).max(200),
});

/**
 * Starts (or resumes) payment for an order that was just created via
 * POST /api/orders. No customer accounts exist in this system, so there is
 * no session to check "ownership" against -- the order id is an
 * unguessable cuid, this endpoint only ever acts on it while the order is
 * still PENDING_PAYMENT, and the response never contains anything beyond a
 * redirect URL. Once an order is PAID (or cancelled/rejected), this route
 * refuses to do anything further with it.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/orders/[orderId]/checkout-session">) {
  const identifier = getClientIdentifier(request);
  const rateLimit = await checkCheckoutSessionRateLimit(identifier);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many payment attempts. Please wait a bit and try again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 60) } }
    );
  }

  const { orderId } = await ctx.params;
  const origin = new URL(request.url).origin;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "We couldn't read that request. Please try again." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Please try again." }, { status: 400 });
  }

  try {
    const result = await getOrCreateCheckoutSession(orderId, origin, parsed.data.trackingToken);

    if (result.ok) {
      return NextResponse.json({ ok: true, url: result.url });
    }

    switch (result.code) {
      case "ORDER_NOT_FOUND":
        return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
      case "ORDER_NOT_PAYABLE":
        return NextResponse.json({ ok: false, message: result.message }, { status: 409 });
      case "ALREADY_PROCESSING":
        return NextResponse.json({ ok: false, message: result.message }, { status: 409 });
      default:
        return NextResponse.json({ ok: false, message: result.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Unhandled error creating checkout session:", error);
    return NextResponse.json({ ok: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
