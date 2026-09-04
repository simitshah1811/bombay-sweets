export const MAX_LINE_QUANTITY = 20;

export interface CartLineModifier {
  modifierOptionId: string;
  groupName: string;
  name: string;
  priceAdjustment: number;
}

/** Sum of a line's modifier price adjustments (per unit). */
export function modifierTotal(modifiers: CartLineModifier[]): number {
  return modifiers.reduce((sum, modifier) => sum + modifier.priceAdjustment, 0);
}

/** Effective per-unit price: base item price plus selected modifiers. */
export function effectiveUnitPrice(unitPrice: number, modifiers: CartLineModifier[]): number {
  return unitPrice + modifierTotal(modifiers);
}

export function lineTotal(unitPrice: number, modifiers: CartLineModifier[], quantity: number): number {
  return effectiveUnitPrice(unitPrice, modifiers) * quantity;
}

/**
 * Identifies lines that represent the exact same customer selection (same
 * item, same modifiers, same instructions) so a repeat "add" merges into the
 * existing line instead of creating a visually duplicate one.
 */
export function buildLineMatchKey(
  itemId: string,
  modifierOptionIds: string[],
  specialInstructions: string
): string {
  const sortedModifiers = [...modifierOptionIds].sort().join(",");
  return `${itemId}|${sortedModifiers}|${specialInstructions.trim()}`;
}

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.round(quantity)));
}
