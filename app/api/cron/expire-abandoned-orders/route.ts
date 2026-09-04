import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/orders/orderLifecycle";
import { findRetryableNotifications, retryNotification } from "@/lib/notifications/service";

/**
 * BOMBAY SWEETS -- DAILY MAINTENANCE SWEEP
 *
 * Three jobs share this one cron slot (Vercel Hobby plan limits cron jobs
 * to once daily, so this stays consolidated rather than spread across
 * multiple routes):
 *
 * 1. ABANDONED ORDER SAFETY NET (Phase 9). The PRIMARY abandoned-payment
 *    mechanism is already fast and event-driven: every Stripe Checkout
 *    Session now expires after 30 minutes (lib/payments/checkoutSession.ts),
 *    and the verified webhook's checkout.session.expired handler
 *    (app/api/stripe/webhook) cancels the order the moment Stripe reports
 *    that. This is a supplementary, lower-frequency safety net for what
 *    that mechanism can't reach on its own -- an order whose
 *    checkout-session creation call never happened at all, or a webhook
 *    delivery that never arrived. The 1-hour cutoff is generous margin
 *    past the 30-minute session expiry, so this should almost always find
 *    nothing to do.
 *
 * 2. RATE LIMIT BUCKET CLEANUP (Phase 9). Sweeps stale rows so the table
 *    doesn't grow unbounded.
 *
 * 3. NOTIFICATION RETRY SWEEP (Phase 10). Every notification event fires
 *    immediately with up to 3 quick in-request retries
 *    (lib/notifications/service.ts); anything still PENDING (or stuck
 *    SENDING) after that gets one more attempt here, up to the shared
 *    5-attempt total budget, after which it's permanently FAILED.
 *
 * Idempotent and safe to run repeatedly: transitionOrder() only acts on
 * orders still in the expected status at the moment it runs, and
 * retryNotification() re-checks each row's own status/attempts before
 * doing anything -- re-running this on already-resolved orders or
 * notifications is always a safe no-op.
 */

const ABANDONED_CUTOFF_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_BUCKET_RETENTION_MS = 24 * 60 * 60 * 1000; // 1 day
const MAX_ORDERS_PER_RUN = 200;
const MAX_NOTIFICATIONS_PER_RUN = 200;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  // Impossible for a customer (or anyone else) to trigger arbitrarily --
  // only a request carrying this exact server-side secret is processed.
  // Vercel Cron automatically sends this header when CRON_SECRET is
  // configured on the project.
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - ABANDONED_CUTOFF_MS);

  const staleOrders = await prisma.order.findMany({
    where: { status: "PENDING_PAYMENT", createdAt: { lt: cutoff } },
    select: { id: true, orderNumber: true },
    take: MAX_ORDERS_PER_RUN,
  });

  let cancelled = 0;
  let skipped = 0;

  for (const order of staleOrders) {
    // Mirrors the webhook's own expired-session handling: a Payment row
    // still sitting PENDING alongside an order we're now cancelling gets
    // marked FAILED too, for the same reason -- this specific attempt is
    // over.
    await prisma.payment.updateMany({
      where: { orderId: order.id, status: "PENDING" },
      data: { status: "FAILED" },
    });

    const result = await transitionOrder({
      orderId: order.id,
      targetStatus: "CANCELLED",
      actor: "SYSTEM",
      reason: "Order expired without payment (automatic cleanup).",
    });

    if (result.ok && !result.alreadyInTargetState) {
      cancelled++;
    } else {
      // Either it raced with something else (already resolved a different
      // way by the time we got to it) or was already cancelled -- either
      // way, nothing more to do here.
      skipped++;
    }
  }

  const { count: bucketsDeleted } = await prisma.rateLimitBucket.deleteMany({
    where: { windowStart: { lt: new Date(Date.now() - RATE_LIMIT_BUCKET_RETENTION_MS) } },
  });

  const retryable = await findRetryableNotifications(MAX_NOTIFICATIONS_PER_RUN);
  for (const notification of retryable) {
    await retryNotification(notification.id);
  }

  return NextResponse.json({
    ok: true,
    staleOrdersFound: staleOrders.length,
    cancelled,
    skipped,
    rateLimitBucketsDeleted: bucketsDeleted,
    notificationsRetried: retryable.length,
  });
}
