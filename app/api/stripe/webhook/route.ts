import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/orders/orderLifecycle";
import { toCents } from "@/lib/money";
import { RESTAURANT_CURRENCY } from "@/lib/payments/currency";

/**
 * BOMBAY SWEETS -- STRIPE WEBHOOK (Phase 8)
 *
 * This is the ONLY mechanism in the entire system that can move an order
 * from PENDING_PAYMENT to PAID. Nothing here trusts the request body until
 * its signature is verified against STRIPE_WEBHOOK_SECRET -- a browser
 * redirect, a query parameter, or a client-submitted "payment succeeded"
 * claim never reaches this logic at all; only Stripe's own signed server
 * call does.
 *
 * Idempotency: Stripe redelivers events (retries, duplicate sends). A
 * WebhookEvent row keyed on Stripe's event id is written only after an
 * event is fully processed, and checked before any work starts. That said,
 * every write this handler performs (Payment upsert, transitionOrder()) is
 * independently idempotent too -- a race or a skipped dedup check can never
 * double-charge, double-transition, or create duplicate history rows.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured -- refusing to process any webhook.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // Raw body, exactly as Stripe sent it -- signature verification fails if
  // this has been touched by any JSON parsing/re-serialization.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error instanceof Error ? error.message : error);
    // Verification failed -- the order/payment tables are never touched.
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const alreadyProcessed = await prisma.webhookEvent.findUnique({ where: { stripeEventId: event.id } });
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.expired":
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        // Acknowledged, deliberately not processed -- this integration only
        // needs these two event types (successful and failed/expired
        // checkout); every other Stripe event type is out of scope.
        break;
    }

    // Written last, only after the event was fully handled -- see the
    // module comment above for why this order matters.
    await prisma.webhookEvent.create({ data: { stripeEventId: event.id, type: event.type } });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing Stripe webhook event ${event.id} (${event.type}):`, error);
    // A non-2xx tells Stripe to retry. Safe to retry because nothing above
    // is written until it's known to be correct, and every write is
    // idempotent on its own.
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.error("checkout.session.completed missing orderId metadata, session:", session.id);
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    console.error("checkout.session.completed references an order that no longer exists:", orderId);
    return;
  }

  // Idempotent no-op: this order was already resolved (by an earlier
  // delivery of this same event, or another verified event). Never
  // re-process a payment that's already been accounted for.
  if (order.status !== "PENDING_PAYMENT") {
    return;
  }

  const expectedCents = toCents(order.totalAmount);
  const receivedCents = session.amount_total;
  const receivedCurrency = session.currency;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);

  // MANDATORY amount check (requirement #21): payment_status === "paid" is
  // never sufficient on its own -- the amount Stripe actually collected
  // must match this order's authoritative total exactly.
  if (receivedCents !== expectedCents) {
    console.error(
      `Amount mismatch for order ${order.orderNumber}: expected ${expectedCents} cents, Stripe reported ${receivedCents}. Order NOT marked paid.`
    );
    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        amount: order.totalAmount,
        currency: RESTAURANT_CURRENCY,
        status: "FAILED",
      },
      update: { status: "FAILED", stripePaymentIntentId: paymentIntentId },
    });
    return;
  }

  // MANDATORY currency check (requirement #22).
  if (receivedCurrency !== RESTAURANT_CURRENCY) {
    console.error(
      `Currency mismatch for order ${order.orderNumber}: expected ${RESTAURANT_CURRENCY}, Stripe reported ${receivedCurrency}. Order NOT marked paid.`
    );
    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        amount: order.totalAmount,
        currency: RESTAURANT_CURRENCY,
        status: "FAILED",
      },
      update: { status: "FAILED", stripePaymentIntentId: paymentIntentId },
    });
    return;
  }

  // Payment becomes the authoritative detailed record first...
  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      amount: order.totalAmount,
      currency: RESTAURANT_CURRENCY,
      status: "SUCCEEDED",
    },
    update: { status: "SUCCEEDED", stripeCheckoutSessionId: session.id, stripePaymentIntentId: paymentIntentId },
  });

  // ...then, and only then, the order is moved through the SAME lifecycle
  // engine every other transition in this system uses. STRIPE is the one
  // actor this specific transition is reserved for.
  const result = await transitionOrder({ orderId: order.id, targetStatus: "PAID", actor: "STRIPE", reason: null });
  if (!result.ok) {
    // The Payment record is already correctly SUCCEEDED (the authoritative
    // fact); a transition failure here means something else changed the
    // order in the same instant. Logged for admin visibility rather than
    // failing the whole webhook, since retrying an already-impossible
    // transition would never succeed.
    console.error(`transitionOrder to PAID failed for order ${order.orderNumber}:`, result);
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  // Fast-path only -- NOT the safety mechanism. A customer can resume
  // payment on an expired session by starting a fresh Checkout Session
  // (lib/payments/checkoutSession.ts), so a *later* session's
  // checkout.session.completed can legitimately arrive after an *earlier*
  // session's checkout.session.expired for the same order -- Stripe
  // doesn't guarantee delivery order across different sessions. This
  // cheap check only skips the obvious case (order already resolved long
  // ago); the real protection is the atomic guard below.
  if (order.status !== "PENDING_PAYMENT") return;

  // ATOMIC race guard (Phase 9 requirement #18): this conditional update
  // only succeeds if the Payment row is still PENDING at this exact
  // instant. If a concurrent/out-of-order checkout.session.completed
  // delivery already flipped it to SUCCEEDED, this matches zero rows and
  // execution stops here -- an already-paid order can never be cancelled
  // by a stale expiration event, no matter how close the timing. Same
  // conditional-update-as-concurrency-guard technique transitionOrder()
  // itself uses for Order.status.
  const guard = await prisma.payment.updateMany({
    where: { orderId: order.id, status: "PENDING" },
    data: { status: "FAILED" },
  });

  if (guard.count === 0) {
    // Either there's no Payment row at all (session expired before
    // checkoutSession.ts finished creating one -- vanishingly rare) or it
    // already resolved another way (SUCCEEDED/FAILED from a race or a
    // retry). Either way, nothing here is safe to change.
    console.error(
      `checkout.session.expired for order ${order.orderNumber}: Payment was not PENDING at expiry time (already resolved elsewhere) -- order left untouched.`
    );
    return;
  }

  // Documented business rule: a Checkout Session that expired without ever
  // completing means that specific payment attempt is permanently over --
  // there is no way to resume IT (a fresh session can always be created).
  // The order moves to CANCELLED (an existing, valid PENDING_PAYMENT
  // transition, no new status invented) so it stops sitting in limbo; it
  // stays fully visible in admin order history, simply no longer awaiting
  // payment. Reaching this line is now guaranteed safe: the guard above
  // just proved, atomically, that no payment had succeeded yet.
  await transitionOrder({
    orderId: order.id,
    targetStatus: "CANCELLED",
    actor: "SYSTEM",
    reason: "Stripe Checkout session expired without payment.",
  });
}
