import "server-only";
import { prisma } from "@/lib/db";
import { toCents, applyPercentage } from "@/lib/money";
import type { DiscountType } from "@/lib/generated/prisma/client";
import { isProductionEnvironment } from "@/lib/env";

export type PromotionRejectionReason =
  | "PROMOTIONS_DISABLED"
  | "NOT_FOUND"
  | "INACTIVE"
  | "NOT_STARTED"
  | "EXPIRED"
  | "MIN_ORDER_NOT_MET"
  | "USAGE_LIMIT_REACHED"
  | "CUSTOMER_LIMIT_REACHED";

const REJECTION_MESSAGES: Record<PromotionRejectionReason, string> = {
  PROMOTIONS_DISABLED: "Promo codes aren't available right now.",
  NOT_FOUND: "That promo code isn't valid.",
  INACTIVE: "That promo code isn't active right now.",
  NOT_STARTED: "That promo code isn't active yet.",
  EXPIRED: "That promo code has expired.",
  MIN_ORDER_NOT_MET: "Your order doesn't meet the minimum for that promo code.",
  USAGE_LIMIT_REACHED: "That promo code has reached its usage limit.",
  CUSTOMER_LIMIT_REACHED: "You've already used that promo code the maximum number of times.",
};

export function describePromotionRejection(reason: PromotionRejectionReason): string {
  return REJECTION_MESSAGES[reason];
}

export interface PromotionValidationInput {
  code: string;
  customerEmail: string;
  subtotalCents: number;
  now?: Date;
}

export type PromotionValidationResult =
  | {
      ok: true;
      promotionId: string;
      code: string;
      discountType: DiscountType;
      discountValue: number;
      discountCents: number;
    }
  | { ok: false; reason: PromotionRejectionReason };

/**
 * Authoritative, server-side promo code check. The discount amount is
 * always computed here from the database's current rules -- the browser
 * never supplies (or is trusted for) a discount amount, percentage, or
 * final total.
 */
export async function validatePromotion(input: PromotionValidationInput): Promise<PromotionValidationResult> {
  // Only demo promotions exist right now (see prisma/seed.ts) -- the whole
  // promotion system stays switched off in Production until Bombay Sweets
  // approves real promotion rules. This check runs before any database
  // lookup, so it applies regardless of what rows happen to exist.
  // Remove this gate (and seed real, isDemoPromotion: false rows) once the
  // client has signed off on production promotion rules.
  if (isProductionEnvironment()) {
    return { ok: false, reason: "PROMOTIONS_DISABLED" };
  }

  const code = input.code.trim().toUpperCase();
  const promotion = await prisma.promotion.findUnique({ where: { code } });
  if (!promotion) return { ok: false, reason: "NOT_FOUND" };
  if (!promotion.isActive) return { ok: false, reason: "INACTIVE" };

  const now = input.now ?? new Date();
  if (promotion.startsAt && now < promotion.startsAt) return { ok: false, reason: "NOT_STARTED" };
  if (promotion.endsAt && now > promotion.endsAt) return { ok: false, reason: "EXPIRED" };

  if (promotion.minOrderAmount != null && input.subtotalCents < toCents(promotion.minOrderAmount)) {
    return { ok: false, reason: "MIN_ORDER_NOT_MET" };
  }

  if (promotion.usageLimit != null) {
    const totalRedemptions = await prisma.promotionRedemption.count({ where: { promotionId: promotion.id } });
    if (totalRedemptions >= promotion.usageLimit) return { ok: false, reason: "USAGE_LIMIT_REACHED" };
  }

  if (promotion.perCustomerLimit != null) {
    const customerRedemptions = await prisma.promotionRedemption.count({
      where: { promotionId: promotion.id, customerEmail: input.customerEmail.trim().toLowerCase() },
    });
    if (customerRedemptions >= promotion.perCustomerLimit) return { ok: false, reason: "CUSTOMER_LIMIT_REACHED" };
  }

  let discountCents: number;
  if (promotion.discountType === "PERCENTAGE") {
    discountCents = applyPercentage(input.subtotalCents, Number(promotion.discountValue));
    if (promotion.maxDiscountAmount != null) {
      discountCents = Math.min(discountCents, toCents(promotion.maxDiscountAmount));
    }
  } else {
    discountCents = toCents(promotion.discountValue);
  }
  // A discount can never exceed the subtotal it's applied to.
  discountCents = Math.min(discountCents, Math.max(0, input.subtotalCents));

  return {
    ok: true,
    promotionId: promotion.id,
    code: promotion.code,
    discountType: promotion.discountType,
    discountValue: Number(promotion.discountValue),
    discountCents,
  };
}
