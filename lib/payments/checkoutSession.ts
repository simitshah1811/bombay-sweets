import "server-only";
import { prisma } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe/client";
import { toCents } from "@/lib/money";
import { RESTAURANT_CURRENCY } from "@/lib/payments/currency";

export type CreateCheckoutSessionResult =
  | { ok: true; url: string }
  | { ok: false; code: "ORDER_NOT_FOUND" }
  | { ok: false; code: "ORDER_NOT_PAYABLE"; message: string }
  | { ok: false; code: "ALREADY_PROCESSING"; message: string }
  | { ok: false; code: "SERVER_ERROR"; message: string };

// Stripe requires at least 30 minutes; this is also the deliberate,
// documented abandoned-order policy (Phase 9 requirement #16) -- a pickup
// order is a "decide now" purchase, not one that needs days to consider.
// A short, explicit window means an abandoned Checkout Session (and the
// PENDING_PAYMENT order behind it) resolves itself quickly via the
// checkout.session.expired webhook, rather than sitting open for Stripe's
// 24-hour default.
const SESSION_EXPIRY_SECONDS = 30 * 60;

/**
 * Creates a Stripe Checkout Session for an order, or reuses one already in
 * flight -- this is what makes clicking "Pay" twice safe (requirement #12).
 * The browser never supplies an amount, currency, or line items; everything
 * charged comes from the order's own server-calculated totals.
 *
 * `trackingToken` is the plaintext customer tracking token (Phase 9) --
 * threaded through purely to build success_url/cancel_url, both of which
 * point at the customer's secure /order/[orderNumber] tracking page. It is
 * never validated here (this function's own authorization is the order id
 * + PENDING_PAYMENT check below); it's just passenger data for the
 * redirect URL.
 */
export async function getOrCreateCheckoutSession(
  orderId: string,
  origin: string,
  trackingToken: string
): Promise<CreateCheckoutSessionResult> {
  const stripe = getStripeClient();
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order) return { ok: false, code: "ORDER_NOT_FOUND" };

  // Payment may only ever be initiated for an order that hasn't been paid,
  // rejected, or cancelled yet -- this is the same PENDING_PAYMENT gate the
  // lifecycle engine itself enforces on the other side of the flow.
  if (order.status !== "PENDING_PAYMENT") {
    return { ok: false, code: "ORDER_NOT_PAYABLE", message: "This order can no longer be paid for." };
  }

  // Idempotency, layer 1: an existing Payment row already points at a
  // Stripe Checkout Session for this exact order. Ask Stripe for its
  // current state rather than assuming -- only reuse it if it's still open.
  if (order.payment?.stripeCheckoutSessionId) {
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(order.payment.stripeCheckoutSessionId);
      if (existingSession.status === "open" && existingSession.url) {
        return { ok: true, url: existingSession.url };
      }
      if (existingSession.status === "complete") {
        // The customer already finished paying on this exact session; the
        // webhook that flips the order to PAID may just not have arrived
        // yet. Never create a second session for the same order -- that
        // would let it be charged twice.
        return {
          ok: false,
          code: "ALREADY_PROCESSING",
          message: "This order's payment is already being confirmed. Please wait a moment and refresh.",
        };
      }
      // Otherwise ("expired") the old session is dead; fall through and
      // create a fresh one below.
    } catch (error) {
      console.error("Failed to retrieve existing Stripe Checkout Session:", error);
      // Fall through and attempt to create a new session rather than
      // blocking the customer entirely on a transient Stripe API error.
    }
  }

  const totalCents = toCents(order.totalAmount);

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: order.customerEmail,
        // A single line item for the exact, already-discounted-and-taxed
        // order total -- Stripe never recomputes the discount or tax
        // itself. This is deliberate: itemizing the cart here and letting
        // Stripe sum it would reintroduce exactly the "calculated twice,
        // might disagree" risk this system avoids everywhere else.
        line_items: [
          {
            price_data: {
              currency: RESTAURANT_CURRENCY,
              product_data: { name: `Bombay Sweets Order #${order.orderNumber}` },
              unit_amount: totalCents,
            },
            quantity: 1,
          },
        ],
        // Minimal, non-sensitive identifiers only -- no customer PII beyond
        // what Stripe Checkout already collects itself.
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
        expires_at: Math.floor(Date.now() / 1000) + SESSION_EXPIRY_SECONDS,
        // Both destinations are the SAME secure tracking page -- whether
        // the customer completes payment or clicks back out of Stripe,
        // they land somewhere that reads the order's real state and reacts
        // correctly either way (paid vs. still-pending-with-a-resume
        // option), rather than two different pages that could each get
        // that logic slightly wrong.
        success_url: `${origin}/order/${encodeURIComponent(order.orderNumber)}?token=${encodeURIComponent(trackingToken)}`,
        cancel_url: `${origin}/order/${encodeURIComponent(order.orderNumber)}?token=${encodeURIComponent(trackingToken)}`,
      },
      // Stripe-level idempotency, layer 2: a network retry of this exact
      // request (same order, same attempt) resolves to the same Stripe
      // object instead of creating a duplicate session at the API layer.
      { idempotencyKey: `checkout-session:${order.idempotencyKey ?? order.id}` }
    );

    if (!session.url) {
      return { ok: false, code: "SERVER_ERROR", message: "We couldn't start payment. Please try again." };
    }

    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        stripeCheckoutSessionId: session.id,
        amount: order.totalAmount,
        currency: RESTAURANT_CURRENCY,
        status: "PENDING",
      },
      update: {
        stripeCheckoutSessionId: session.id,
        amount: order.totalAmount,
        currency: RESTAURANT_CURRENCY,
        status: "PENDING",
      },
    });

    return { ok: true, url: session.url };
  } catch (error) {
    console.error("Failed to create Stripe Checkout Session:", error);
    return { ok: false, code: "SERVER_ERROR", message: "We couldn't start payment. Please try again." };
  }
}
