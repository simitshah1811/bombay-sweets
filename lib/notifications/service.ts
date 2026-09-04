import "server-only";
import { prisma } from "@/lib/db";
import { Prisma, type NotificationEventType } from "@/lib/generated/prisma/client";
import { resolveRecipient, sendEmail } from "./email";
import { decryptTrackingToken } from "@/lib/orders/trackingTokenCipher";
import { getRestaurantInfoForNotifications } from "./restaurantInfo";
import { EMAIL_TEMPLATES } from "./templates";
import type { NotificationOrderInfo } from "./types";

const ORDER_INCLUDE = { items: { include: { modifiers: true } }, payment: true } as const;
type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

// Up to 3 quick attempts happen synchronously, back to back, the moment an
// event fires (so a momentary provider blip resolves itself immediately).
// If all 3 fail, the row is left PENDING (if still under the 5-attempt
// total budget) for the daily cron sweep to pick up later -- see
// app/api/cron/expire-abandoned-orders, which now also retries
// notifications. Once the total budget is exhausted, FAILED is permanent;
// nothing retries it again.
const MAX_IMMEDIATE_ATTEMPTS = 3;
const IMMEDIATE_RETRY_DELAYS_MS = [500, 1500];
export const MAX_TOTAL_ATTEMPTS = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function buildTrackingUrl(orderNumber: string, token: string): string {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${origin}/order/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`;
}

function toNotificationOrderInfo(order: OrderWithRelations, trackingToken: string): NotificationOrderInfo {
  return {
    orderNumber: order.orderNumber,
    customerFirstName: order.customerFirstName,
    customerEmail: order.customerEmail,
    pickupType: order.pickupType,
    requestedPickupTime: order.requestedPickupTime?.toISOString() ?? null,
    specialInstructions: order.specialInstructions,
    items: order.items.map((item) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      lineTotal: Number(item.lineTotal),
      modifiers: item.modifiers.map((m) => ({ groupName: m.modifierGroupName, name: m.modifierName })),
      specialInstructions: item.specialInstructions,
    })),
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    promotionCode: order.promotionCode,
    taxAmount: Number(order.taxAmount),
    totalAmount: Number(order.totalAmount),
    paymentStatus: order.payment?.status ?? null,
    trackingUrl: buildTrackingUrl(order.orderNumber, trackingToken),
  };
}

/**
 * The single entry point every business event calls -- order creation and
 * the lifecycle engine, and nowhere else (no React component, no admin
 * component, no route handler builds an email directly). See the doc
 * comments on lib/orders/createOrder.ts and lib/orders/orderLifecycle.ts
 * for where this is actually invoked.
 *
 * Idempotency: the (orderId, eventType, channel) unique constraint on
 * Notification is the real guarantee here -- this function ATTEMPTS an
 * insert first; only the caller whose insert actually succeeds proceeds to
 * send anything. A webhook retry, an admin double-click, or a concurrent
 * request racing to fire the same event all resolve to "someone already
 * has this," full stop, at the database level -- not by trusting
 * in-memory state that a serverless function can't reliably share anyway.
 */
export async function notifyOrderEvent(orderId: string, eventType: NotificationEventType): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order) {
    console.error(`notifyOrderEvent: order ${orderId} not found.`);
    return;
  }

  if (!order.encryptedTrackingToken) {
    // Orders created before Phase 9/10 existed (demo orders) have no
    // tracking token and can't get a working link -- nothing safe to send.
    console.error(`notifyOrderEvent: order ${order.orderNumber} has no tracking token; skipping ${eventType}.`);
    return;
  }

  let trackingToken: string;
  try {
    trackingToken = decryptTrackingToken(order.encryptedTrackingToken);
  } catch (error) {
    // Never sends a malformed link, never crashes the order flow (this
    // runs inside after(), well past the order/status write already
    // succeeding) -- just a safe, non-sensitive server-side log entry.
    console.error(`notifyOrderEvent: failed to decrypt tracking token for order ${order.orderNumber}; skipping ${eventType}.`, error instanceof Error ? error.message : error);
    return;
  }

  const restaurant = await getRestaurantInfoForNotifications();
  if (!restaurant) {
    console.error(`notifyOrderEvent: no Restaurant row configured; skipping ${eventType} for order ${order.orderNumber}.`);
    return;
  }

  const recipientResolution = resolveRecipient(order.customerEmail);

  let notification: { id: string };
  try {
    notification = await prisma.notification.create({
      data: {
        orderId: order.id,
        eventType,
        channel: "EMAIL",
        status: recipientResolution.send ? "PENDING" : "SKIPPED",
        recipientEmail: recipientResolution.send ? recipientResolution.recipientEmail : order.customerEmail,
      },
    });
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      // Already claimed by an earlier delivery of this same event -- exactly the idempotency guarantee working as intended.
      return;
    }
    console.error(`notifyOrderEvent: failed to create Notification row for order ${order.orderNumber} / ${eventType}:`, error);
    return;
  }

  if (!recipientResolution.send) {
    // Row is already correctly SKIPPED -- nothing more to do. (Reason is
    // either NOTIFICATIONS_ENABLED=false, or a non-production environment
    // with no NOTIFICATION_TEST_EMAIL configured -- either way, safe.)
    return;
  }

  const orderInfo = toNotificationOrderInfo(order, trackingToken);
  const content = EMAIL_TEMPLATES[eventType](orderInfo, restaurant);

  await attemptDelivery(notification.id, recipientResolution.recipientEmail, content, 1);
}

/**
 * Sends (with immediate short-backoff retries), and records the outcome.
 * Also the function the daily cron sweep calls to resume a notification
 * that's still PENDING after its immediate attempts were exhausted --
 * `startingAttempt` is whatever `attempts` the row already has, so the
 * MAX_TOTAL_ATTEMPTS budget is shared across both paths, not reset.
 */
export async function attemptDelivery(
  notificationId: string,
  recipientEmail: string,
  content: { subject: string; html: string; text: string },
  startingAttempt: number
): Promise<void> {
  await prisma.notification.update({ where: { id: notificationId }, data: { status: "SENDING" } });

  const immediateBudget = Math.max(0, Math.min(MAX_IMMEDIATE_ATTEMPTS, MAX_TOTAL_ATTEMPTS - startingAttempt + 1));
  let attempt = startingAttempt - 1;
  let lastError = "";

  for (let i = 0; i < immediateBudget; i++) {
    attempt = startingAttempt + i;
    const result = await sendEmail(recipientEmail, content);
    if (result.ok) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: "SENT", providerMessageId: result.providerMessageId, sentAt: new Date(), attempts: attempt },
      });
      return;
    }
    lastError = result.error;
    if (i < immediateBudget - 1) {
      await sleep(IMMEDIATE_RETRY_DELAYS_MS[i] ?? 1500);
    }
  }

  const permanentlyFailed = attempt >= MAX_TOTAL_ATTEMPTS;
  await prisma.notification.update({
    where: { id: notificationId },
    data: { status: permanentlyFailed ? "FAILED" : "PENDING", attempts: attempt, lastError: lastError.slice(0, 500) },
  });
}

// A row can be left PENDING (immediate attempts exhausted, budget
// remains) or stuck SENDING (the process was killed mid-attempt --
// vanishingly rare on Vercel, but not impossible) -- both are eligible
// for the daily retry sweep. The age cutoff avoids racing with a
// same-second immediate-send attempt that's still legitimately in flight.
const RETRY_ELIGIBLE_AGE_MS = 5 * 60 * 1000;

export async function findRetryableNotifications(limit: number): Promise<{ id: string }[]> {
  return prisma.notification.findMany({
    where: {
      status: { in: ["PENDING", "SENDING"] },
      attempts: { lt: MAX_TOTAL_ATTEMPTS },
      createdAt: { lt: new Date(Date.now() - RETRY_ELIGIBLE_AGE_MS) },
    },
    select: { id: true },
    take: limit,
  });
}

/** Called by the daily cron sweep (app/api/cron/expire-abandoned-orders) for each row findRetryableNotifications() returns. */
export async function retryNotification(notificationId: string): Promise<void> {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) return;
  if (notification.status !== "PENDING" && notification.status !== "SENDING") return;

  if (notification.attempts >= MAX_TOTAL_ATTEMPTS) {
    await prisma.notification.update({ where: { id: notificationId }, data: { status: "FAILED" } });
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: notification.orderId }, include: ORDER_INCLUDE });
  if (!order || !order.encryptedTrackingToken) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: "FAILED", lastError: "Order or tracking token no longer available." },
    });
    return;
  }

  let trackingToken: string;
  try {
    trackingToken = decryptTrackingToken(order.encryptedTrackingToken);
  } catch (error) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: "FAILED", lastError: "Failed to decrypt tracking token." },
    });
    console.error(`retryNotification: failed to decrypt tracking token for order ${order.orderNumber}:`, error instanceof Error ? error.message : error);
    return;
  }

  const restaurant = await getRestaurantInfoForNotifications();
  if (!restaurant) return; // transient -- try again on the next sweep

  const orderInfo = toNotificationOrderInfo(order, trackingToken);
  const content = EMAIL_TEMPLATES[notification.eventType](orderInfo, restaurant);

  await attemptDelivery(notification.id, notification.recipientEmail, content, notification.attempts + 1);
}
