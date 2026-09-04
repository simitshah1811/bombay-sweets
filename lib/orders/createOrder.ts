import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { validateCart, type CartLineInput, type CartProblem } from "@/lib/orders/validateCart";
import { validatePromotion, describePromotionRejection } from "@/lib/orders/validatePromotion";
import { validatePickupSelection } from "@/lib/pickup/schedule";
import { generateUniqueOrderNumber } from "@/lib/orders/orderNumber";
import { getPublicBusinessSettings } from "@/lib/business/queries";
import { toCents, fromCents, applyPercentage } from "@/lib/money";
import { generateTrackingToken, hashTrackingToken } from "@/lib/orders/trackingToken";
import { encryptTrackingToken, decryptTrackingToken } from "@/lib/orders/trackingTokenCipher";

export interface CreateOrderInput {
  idempotencyKey: string;
  customer: { firstName: string; lastName: string; email: string; phone: string };
  pickup: { type: "ASAP" | "SCHEDULED"; requestedPickupTime: string | null };
  notes: string;
  promoCode: string | null;
  lines: CartLineInput[];
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  pickupType: "ASAP" | "SCHEDULED";
  requestedPickupTime: string | null;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string | null;
  items: {
    itemName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    modifiers: { groupName: string; name: string; priceAdjustment: number }[];
    specialInstructions: string;
  }[];
  subtotal: number;
  discountAmount: number;
  promotionCode: string | null;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  /**
   * Plaintext customer order-tracking token -- present in this API response
   * ONLY. Never re-derivable afterward (only its hash is stored), so the
   * client must capture it here to build the /order/[orderNumber] tracking
   * link (e.g. as the Stripe success_url destination).
   */
  trackingToken: string;
}

export type CreateOrderResult =
  | { ok: true; order: OrderSummary }
  | { ok: false; code: "CART_PROBLEMS"; problems: CartProblem[] }
  | { ok: false; code: "PICKUP_INVALID"; message: string }
  | { ok: false; code: "PROMO_INVALID"; message: string }
  | { ok: false; code: "SERVER_ERROR"; message: string };

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: { include: { modifiers: true } } } }>;

function toSummary(order: OrderWithItems, trackingToken: string): OrderSummary {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    pickupType: order.pickupType,
    requestedPickupTime: order.requestedPickupTime ? order.requestedPickupTime.toISOString() : null,
    customerFirstName: order.customerFirstName,
    customerLastName: order.customerLastName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    notes: order.specialInstructions,
    items: order.items.map((item) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
      modifiers: item.modifiers.map((m) => ({
        groupName: m.modifierGroupName,
        name: m.modifierName,
        priceAdjustment: Number(m.priceAdjustment),
      })),
      specialInstructions: item.specialInstructions ?? "",
    })),
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    promotionCode: order.promotionCode,
    taxAmount: Number(order.taxAmount),
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    trackingToken,
  };
}

const ORDER_WITH_ITEMS_INCLUDE = { items: { include: { modifiers: true } } } as const;

/**
 * The single authoritative entry point for turning a submitted cart into a
 * real order. Re-validates everything server-side (pickup time, items,
 * modifiers, prices, promo code, availability) and only writes to the
 * database if every check passes -- never trusts anything the browser
 * calculated. Pricing flow: subtotal -> discount -> tax -> total, entirely
 * in integer cents (see lib/money.ts). There is no tip anywhere in this
 * pipeline.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  // Idempotency: a repeat submission of the same checkout attempt (double
  // click, refresh, network retry) resolves to the order already created,
  // instead of creating a second one.
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: ORDER_WITH_ITEMS_INCLUDE,
  });
  if (existing) {
    // Phase 10.1: only the encrypted token is stored (no plaintext column
    // anymore), so a retried request (double-click, refresh, network
    // retry) decrypts it server-side to hand the browser back the SAME
    // token rather than minting a new one every time.
    if (existing.encryptedTrackingToken) {
      try {
        const trackingToken = decryptTrackingToken(existing.encryptedTrackingToken);
        return { ok: true, order: toSummary(existing, trackingToken) };
      } catch (error) {
        console.error(`createOrder: failed to decrypt tracking token for existing order ${existing.orderNumber}:`, error instanceof Error ? error.message : error);
        // Falls through to the defensive fallback below rather than
        // failing the whole request -- a corrupt/undecryptable value
        // shouldn't block a customer from reaching checkout again.
      }
    }
    // Defensive fallback -- covers an order with no encrypted token, or one
    // that failed to decrypt (shouldn't happen for anything created after
    // this migration, but never worth a hard failure here).
    const trackingToken = generateTrackingToken();
    const refreshed = await prisma.order.update({
      where: { id: existing.id },
      data: { trackingTokenHash: hashTrackingToken(trackingToken), encryptedTrackingToken: encryptTrackingToken(trackingToken) },
      include: ORDER_WITH_ITEMS_INCLUDE,
    });
    return { ok: true, order: toSummary(refreshed, trackingToken) };
  }

  const pickupCheck = await validatePickupSelection({
    pickupType: input.pickup.type,
    requestedPickupTime: input.pickup.requestedPickupTime ? new Date(input.pickup.requestedPickupTime) : null,
  });
  if (!pickupCheck.valid) {
    return { ok: false, code: "PICKUP_INVALID", message: pickupCheck.error ?? "That pickup time isn't available." };
  }

  const cartCheck = await validateCart(input.lines);
  if (!cartCheck.ok) {
    return { ok: false, code: "CART_PROBLEMS", problems: cartCheck.problems };
  }

  const subtotalCents = cartCheck.subtotalCents;

  let discountCents = 0;
  let appliedPromotion: { id: string; code: string; discountType: "PERCENTAGE" | "FIXED_AMOUNT"; discountValue: number } | null = null;

  if (input.promoCode && input.promoCode.trim().length > 0) {
    const promoCheck = await validatePromotion({
      code: input.promoCode,
      customerEmail: input.customer.email,
      subtotalCents,
    });
    if (!promoCheck.ok) {
      return { ok: false, code: "PROMO_INVALID", message: describePromotionRejection(promoCheck.reason) };
    }
    discountCents = promoCheck.discountCents;
    appliedPromotion = {
      id: promoCheck.promotionId,
      code: promoCheck.code,
      discountType: promoCheck.discountType,
      discountValue: promoCheck.discountValue,
    };
  }

  const { taxRatePercent } = await getPublicBusinessSettings();
  const taxableCents = Math.max(0, subtotalCents - discountCents);
  const taxCents = applyPercentage(taxableCents, taxRatePercent);
  const totalCents = subtotalCents - discountCents + taxCents;

  const trackingToken = generateTrackingToken();

  try {
    const order = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { email: input.customer.email },
        update: {
          firstName: input.customer.firstName,
          lastName: input.customer.lastName,
          phone: input.customer.phone,
        },
        create: {
          firstName: input.customer.firstName,
          lastName: input.customer.lastName,
          email: input.customer.email,
          phone: input.customer.phone,
        },
      });

      const orderNumber = await generateUniqueOrderNumber(tx);

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          idempotencyKey: input.idempotencyKey,
          trackingTokenHash: hashTrackingToken(trackingToken),
          encryptedTrackingToken: encryptTrackingToken(trackingToken),
          customerId: customer.id,
          customerFirstName: input.customer.firstName,
          customerLastName: input.customer.lastName,
          customerEmail: input.customer.email,
          customerPhone: input.customer.phone,
          pickupType: input.pickup.type,
          requestedPickupTime: pickupCheck.resolvedPickupTime,
          specialInstructions: input.notes.trim().slice(0, 1000) || null,
          subtotal: fromCents(subtotalCents),
          discountAmount: fromCents(discountCents),
          taxAmount: fromCents(taxCents),
          // No tip functionality anywhere in this system -- always zero, never set from user input.
          tipAmount: 0,
          totalAmount: fromCents(totalCents),
          promotionCode: appliedPromotion?.code ?? null,
          promotionDiscountType: appliedPromotion?.discountType ?? null,
          promotionDiscountValue: appliedPromotion ? appliedPromotion.discountValue : null,
          status: "PENDING_PAYMENT",
          isDemoOrder: true,
          items: {
            create: cartCheck.lines.map((line) => ({
              menuItemId: line.itemId,
              itemName: line.itemName,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
              lineTotal: line.lineTotal,
              specialInstructions: line.specialInstructions || null,
              modifiers: {
                create: line.modifiers.map((modifier) => ({
                  modifierOptionId: modifier.modifierOptionId,
                  modifierGroupName: modifier.groupName,
                  modifierName: modifier.name,
                  priceAdjustment: modifier.priceAdjustment,
                })),
              },
            })),
          },
          statusHistory: {
            // previousStatus is null here -- this is the order's first status, not a transition.
            create: { status: "PENDING_PAYMENT", actor: "SYSTEM", note: "Order created" },
          },
        },
        include: ORDER_WITH_ITEMS_INCLUDE,
      });

      // A promo code only counts as redeemed once the order it belongs to
      // actually exists -- entering a code alone never records a redemption.
      if (appliedPromotion) {
        await tx.promotionRedemption.create({
          data: {
            promotionId: appliedPromotion.id,
            orderId: createdOrder.id,
            customerEmail: input.customer.email.trim().toLowerCase(),
            discountAmount: fromCents(discountCents),
          },
        });
      }

      return createdOrder;
    });

    // No notification is sent here on purpose. The first email a customer
    // gets is PAYMENT_SUCCEEDED (triggered from lib/orders/orderLifecycle.ts
    // once the Stripe webhook verifies real payment) -- an immediate
    // "order received" email at creation time was redundant with that in
    // the normal fast checkout path, and premature for an order that's
    // abandoned before payment ever completes.
    return { ok: true, order: toSummary(order, trackingToken) };
  } catch (error) {
    console.error("Order creation failed:", error);
    return {
      ok: false,
      code: "SERVER_ERROR",
      message: "We couldn't create your order. Please try again, or call us directly.",
    };
  }
}
