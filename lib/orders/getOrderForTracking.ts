import "server-only";
import { prisma } from "@/lib/db";
import type { OrderStatus, PaymentStatus } from "@/lib/generated/prisma/client";
import { verifyTrackingToken } from "@/lib/orders/trackingToken";

export interface CustomerOrderView {
  // Used internally (e.g. the resume-payment button's fetch target) --
  // never rendered as visible text on the page.
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus | null;
  pickupType: "ASAP" | "SCHEDULED";
  requestedPickupTime: string | null;
  customerFirstName: string;
  specialInstructions: string | null;
  items: {
    itemName: string;
    quantity: number;
    lineTotal: number;
    modifiers: { groupName: string; name: string }[];
    specialInstructions: string | null;
  }[];
  subtotal: number;
  discountAmount: number;
  promotionCode: string | null;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  /** Whether a Stripe Checkout Session still exists to resume payment against. */
  hasPaymentRecord: boolean;
}

export type TrackingLookupResult = { ok: true; order: CustomerOrderView } | { ok: false };

/**
 * The single, secure entry point for customer order tracking. Looking up
 * by orderNumber alone is deliberately never enough -- the caller must also
 * present the exact token generated for that order at checkout. A wrong
 * token and a nonexistent order number produce the identical {ok:false}
 * result in identical time (see verifyTrackingToken's dummy-hash
 * comparison), so neither the response shape nor its timing reveals
 * whether a given order number exists.
 */
export async function getOrderForTracking(orderNumber: string, token: string | undefined): Promise<TrackingLookupResult> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: { include: { modifiers: true } }, payment: true },
  });

  if (!order) {
    // Still performs the same dummy-hash comparison work as the real path
    // below, so a nonexistent order number takes the same time to reject
    // as a real order number with the wrong token.
    verifyTrackingToken(token, null);
    return { ok: false };
  }

  if (!verifyTrackingToken(token, order.trackingTokenHash)) {
    return { ok: false };
  }

  return {
    ok: true,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payment?.status ?? null,
      pickupType: order.pickupType,
      requestedPickupTime: order.requestedPickupTime?.toISOString() ?? null,
      customerFirstName: order.customerFirstName,
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
      createdAt: order.createdAt.toISOString(),
      hasPaymentRecord: order.payment != null,
    },
  };
}
