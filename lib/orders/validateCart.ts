import "server-only";
import { prisma } from "@/lib/db";
import { MAX_LINE_QUANTITY } from "@/lib/cart/cartMath";
import { toCents, fromCents } from "@/lib/money";

export interface CartLineInput {
  itemId: string;
  quantity: number;
  modifierOptionIds: string[];
  specialInstructions: string;
  /** What the client's cart snapshot believes the price is -- used only to detect drift, never to calculate. */
  expectedUnitPrice: number;
  expectedModifierPrices: Record<string, number>;
}

export type CartProblem =
  | { type: "CART_EMPTY" }
  | { type: "ITEM_NOT_FOUND"; itemId: string }
  | { type: "ITEM_UNAVAILABLE"; itemId: string; itemName: string }
  | { type: "INVALID_QUANTITY"; itemId: string; itemName: string }
  | { type: "PRICE_CHANGED"; itemId: string; itemName: string; oldPrice: number; newPrice: number }
  | {
      type: "MODIFIER_PRICE_CHANGED";
      itemId: string;
      itemName: string;
      modifierOptionId: string;
      modifierName: string;
      oldPrice: number;
      newPrice: number;
    }
  | { type: "MODIFIER_INVALID"; itemId: string; itemName: string; modifierOptionId: string }
  | { type: "MODIFIER_UNAVAILABLE"; itemId: string; itemName: string; modifierOptionId: string; modifierName: string }
  | { type: "MODIFIER_GROUP_INVALID"; itemId: string; itemName: string; groupName: string; reason: "too_few" | "too_many" };

export interface ValidatedLineModifier {
  modifierOptionId: string;
  groupName: string;
  name: string;
  priceAdjustment: number;
}

export interface ValidatedLine {
  itemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  specialInstructions: string;
  modifiers: ValidatedLineModifier[];
  lineTotal: number;
}

export type ValidateCartResult =
  | { ok: true; lines: ValidatedLine[]; subtotalCents: number }
  | { ok: false; problems: CartProblem[] };

/**
 * Re-derives every cart line entirely from the database. The browser's
 * prices, modifier prices, and totals are never trusted for calculation --
 * `expectedUnitPrice`/`expectedModifierPrices` are used only to detect drift
 * (a price that changed since the item was added) and produce a clear
 * "please review your cart" outcome instead of silently charging a stale or
 * manipulated amount. All math happens in integer cents (see lib/money.ts)
 * so this never relies on imprecise floating-point arithmetic.
 */
export async function validateCart(lines: CartLineInput[]): Promise<ValidateCartResult> {
  if (lines.length === 0) {
    return { ok: false, problems: [{ type: "CART_EMPTY" }] };
  }

  const itemIds = [...new Set(lines.map((line) => line.itemId))];
  const items = await prisma.menuItem.findMany({
    where: { id: { in: itemIds } },
    include: {
      modifierGroups: {
        include: { modifierGroup: { include: { options: true } } },
      },
    },
  });
  const itemsById = new Map(items.map((item) => [item.id, item]));

  const problems: CartProblem[] = [];
  const validatedLines: ValidatedLine[] = [];
  let subtotalCents = 0;

  for (const line of lines) {
    const item = itemsById.get(line.itemId);

    if (!item || item.isArchived) {
      problems.push({ type: "ITEM_NOT_FOUND", itemId: line.itemId });
      continue;
    }
    if (!item.isAvailable) {
      problems.push({ type: "ITEM_UNAVAILABLE", itemId: item.id, itemName: item.name });
      continue;
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_LINE_QUANTITY) {
      problems.push({ type: "INVALID_QUANTITY", itemId: item.id, itemName: item.name });
      continue;
    }

    const authoritativePriceCents = toCents(item.price);
    if (authoritativePriceCents !== toCents(line.expectedUnitPrice)) {
      problems.push({
        type: "PRICE_CHANGED",
        itemId: item.id,
        itemName: item.name,
        oldPrice: line.expectedUnitPrice,
        newPrice: fromCents(authoritativePriceCents),
      });
      continue;
    }

    const attachedGroups = item.modifierGroups.map((link) => link.modifierGroup);
    const optionLookup = new Map<
      string,
      { groupId: string; groupName: string; name: string; priceAdjustmentCents: number; isAvailable: boolean }
    >();
    for (const group of attachedGroups) {
      for (const option of group.options) {
        optionLookup.set(option.id, {
          groupId: group.id,
          groupName: group.name,
          name: option.name,
          priceAdjustmentCents: toCents(option.priceAdjustment),
          isAvailable: option.isAvailable,
        });
      }
    }

    let lineHasProblem = false;
    const resolvedModifiers: ValidatedLineModifier[] = [];
    let modifierCentsSum = 0;
    const selectedCountByGroupId = new Map<string, number>();

    for (const modifierOptionId of line.modifierOptionIds) {
      const option = optionLookup.get(modifierOptionId);
      if (!option) {
        problems.push({ type: "MODIFIER_INVALID", itemId: item.id, itemName: item.name, modifierOptionId });
        lineHasProblem = true;
        continue;
      }
      if (!option.isAvailable) {
        problems.push({
          type: "MODIFIER_UNAVAILABLE",
          itemId: item.id,
          itemName: item.name,
          modifierOptionId,
          modifierName: option.name,
        });
        lineHasProblem = true;
        continue;
      }
      const expectedModifierPrice = line.expectedModifierPrices[modifierOptionId];
      if (expectedModifierPrice !== undefined && option.priceAdjustmentCents !== toCents(expectedModifierPrice)) {
        problems.push({
          type: "MODIFIER_PRICE_CHANGED",
          itemId: item.id,
          itemName: item.name,
          modifierOptionId,
          modifierName: option.name,
          oldPrice: expectedModifierPrice,
          newPrice: fromCents(option.priceAdjustmentCents),
        });
        lineHasProblem = true;
        continue;
      }

      selectedCountByGroupId.set(option.groupId, (selectedCountByGroupId.get(option.groupId) ?? 0) + 1);
      modifierCentsSum += option.priceAdjustmentCents;
      resolvedModifiers.push({
        modifierOptionId,
        groupName: option.groupName,
        name: option.name,
        priceAdjustment: fromCents(option.priceAdjustmentCents),
      });
    }

    // Check min/max for every group attached to this item, including groups
    // with zero selections -- this is what catches a missing required modifier.
    for (const group of attachedGroups) {
      const count = selectedCountByGroupId.get(group.id) ?? 0;
      if (count < group.minSelect) {
        problems.push({ type: "MODIFIER_GROUP_INVALID", itemId: item.id, itemName: item.name, groupName: group.name, reason: "too_few" });
        lineHasProblem = true;
      } else if (count > group.maxSelect) {
        problems.push({ type: "MODIFIER_GROUP_INVALID", itemId: item.id, itemName: item.name, groupName: group.name, reason: "too_many" });
        lineHasProblem = true;
      }
    }

    if (lineHasProblem) continue;

    const lineTotalCents = (authoritativePriceCents + modifierCentsSum) * line.quantity;
    subtotalCents += lineTotalCents;

    validatedLines.push({
      itemId: item.id,
      itemName: item.name,
      unitPrice: fromCents(authoritativePriceCents),
      quantity: line.quantity,
      specialInstructions: line.specialInstructions.trim().slice(0, 500),
      modifiers: resolvedModifiers,
      lineTotal: fromCents(lineTotalCents),
    });
  }

  if (problems.length > 0) {
    return { ok: false, problems };
  }

  return { ok: true, lines: validatedLines, subtotalCents };
}
