import type { OrderStatus, NotificationEventType } from "@/lib/generated/prisma/client";

/**
 * Which order statuses warrant a customer notification, and which event
 * that maps to. COMPLETED is deliberately absent -- the customer already
 * has their food in hand by then, no notification needed. This is the
 * ONLY place this mapping exists; lib/orders/orderLifecycle.ts consults it
 * after a transition commits, nothing else invents its own copy.
 */
export const STATUS_TO_NOTIFICATION_EVENT: Partial<Record<OrderStatus, NotificationEventType>> = {
  PAID: "PAYMENT_SUCCEEDED",
  ACCEPTED: "ORDER_ACCEPTED",
  PREPARING: "ORDER_PREPARING",
  READY: "ORDER_READY",
  CANCELLED: "ORDER_CANCELLED",
  REJECTED: "ORDER_REJECTED",
};
