"use client";

import { useMemo, useState } from "react";
import type { ModifierGroupForDisplay } from "@/lib/menu/queries";
import type { CartLineModifier } from "@/lib/cart/CartContext";
import type { PreparationStatus } from "@/lib/generated/prisma/client";
import { MAX_LINE_QUANTITY, clampQuantity } from "@/lib/cart/cartMath";
import { formatPrice } from "@/lib/utils/formatPrice";
import { PillButton } from "@/components/ui/PillButton";
import { PrepBadge } from "@/components/ui/Badge";

function formatAdjustment(amount: number): string | null {
  if (amount === 0) return null;
  return amount > 0 ? `+${formatPrice(amount)}` : `-${formatPrice(Math.abs(amount))}`;
}

export interface CustomizeConfirmResult {
  modifiers: CartLineModifier[];
  specialInstructions: string;
  quantity: number;
}

export function ItemCustomizeModal({
  item,
  mode,
  initialQuantity = 1,
  initialModifierOptionIds = [],
  initialSpecialInstructions = "",
  onConfirm,
  onClose,
}: {
  item: {
    id: string;
    name: string;
    price: number;
    modifierGroups: ModifierGroupForDisplay[];
    preparationStatus?: PreparationStatus;
    preparationMinutes?: number | null;
  };
  mode: "add" | "edit";
  initialQuantity?: number;
  initialModifierOptionIds?: string[];
  initialSpecialInstructions?: string;
  onConfirm: (result: CustomizeConfirmResult) => void;
  onClose: () => void;
}) {
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const group of item.modifierGroups) {
      initial[group.id] = group.options
        .filter((option) => initialModifierOptionIds.includes(option.id))
        .map((option) => option.id);
    }
    return initial;
  });
  const [instructions, setInstructions] = useState(initialSpecialInstructions);
  const [quantity, setQuantityState] = useState(clampQuantity(initialQuantity));
  const [errors, setErrors] = useState<string[]>([]);

  function toggleOption(group: ModifierGroupForDisplay, optionId: string) {
    setSelectedByGroup((prev) => {
      const current = prev[group.id] ?? [];
      const isSelected = current.includes(optionId);

      if (group.maxSelect === 1) {
        // Radio-style: selecting clears any other choice; re-clicking the
        // active option clears it, but only if the group isn't required.
        if (isSelected) {
          return group.minSelect > 0 ? prev : { ...prev, [group.id]: [] };
        }
        return { ...prev, [group.id]: [optionId] };
      }

      // Checkbox-style, respecting maxSelect.
      if (isSelected) {
        return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      }
      if (current.length >= group.maxSelect) return prev;
      return { ...prev, [group.id]: [...current, optionId] };
    });
  }

  const modifiers = useMemo<CartLineModifier[]>(() => {
    const result: CartLineModifier[] = [];
    for (const group of item.modifierGroups) {
      const selectedIds = selectedByGroup[group.id] ?? [];
      for (const option of group.options) {
        if (selectedIds.includes(option.id)) {
          result.push({
            modifierOptionId: option.id,
            groupName: group.name,
            name: option.name,
            priceAdjustment: option.priceAdjustment,
          });
        }
      }
    }
    return result;
  }, [item.modifierGroups, selectedByGroup]);

  const modifierTotal = modifiers.reduce((sum, m) => sum + m.priceAdjustment, 0);
  const effectiveUnitPrice = item.price + modifierTotal;

  function handleConfirm() {
    const validationErrors: string[] = [];
    for (const group of item.modifierGroups) {
      const count = (selectedByGroup[group.id] ?? []).length;
      if (count < group.minSelect) {
        validationErrors.push(
          group.minSelect === 1
            ? `Please select an option for ${group.name}.`
            : `Please select at least ${group.minSelect} options for ${group.name}.`
        );
      }
    }
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    onConfirm({ modifiers, specialInstructions: instructions.trim(), quantity });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-cream shadow-[0_0_40px_rgba(0,0,0,0.18)] lg:max-w-lg lg:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-6">
          <div>
            <h2 className="font-display text-2xl text-ink">{item.name}</h2>
            {item.preparationStatus && (
              <PrepBadge status={item.preparationStatus} minutes={item.preparationMinutes ?? null} className="mt-1.5" />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-ink/30 p-2 text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {item.modifierGroups.map((group) => (
            <fieldset key={group.id} className="mb-7 last:mb-0">
              <legend className="mb-3 flex items-baseline gap-2 font-body text-[15px] font-medium text-ink">
                {group.name}
                <span className="font-label text-[11px] uppercase tracking-[0.1em] text-ink/40">
                  {group.minSelect > 0 ? "Required" : "Optional"}
                  {group.maxSelect > 1 ? ` · choose up to ${group.maxSelect}` : ""}
                </span>
              </legend>
              <div className="flex flex-col gap-2.5">
                {group.options.map((option) => {
                  const selected = (selectedByGroup[group.id] ?? []).includes(option.id);
                  const adjustmentLabel = formatAdjustment(option.priceAdjustment);
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-control border px-4 py-3 transition-colors duration-200 ${
                        !option.isAvailable
                          ? "cursor-not-allowed border-ink/10 opacity-40"
                          : selected
                            ? "border-ink bg-peach/60"
                            : "border-ink/20 hover:border-ink/50"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type={group.maxSelect === 1 ? "radio" : "checkbox"}
                          name={group.id}
                          checked={selected}
                          disabled={!option.isAvailable}
                          onChange={() => toggleOption(group, option.id)}
                          className="h-4 w-4 accent-ink"
                        />
                        <span className="font-body text-[15px] text-ink">
                          {option.name}
                          {!option.isAvailable && " (unavailable)"}
                        </span>
                      </span>
                      {adjustmentLabel && (
                        <span className="font-body text-sm text-ink/60">{adjustmentLabel}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="mb-7">
            <label htmlFor="special-instructions" className="mb-2 block font-body text-[15px] font-medium text-ink">
              Special instructions <span className="text-ink/40">(optional)</span>
            </label>
            <textarea
              id="special-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value.slice(0, 200))}
              placeholder="e.g. less spicy, extra sauce"
              rows={2}
              className="w-full resize-none rounded-control border border-ink/20 bg-cream px-4 py-3 font-body text-[15px] text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="font-body text-[15px] font-medium text-ink">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantityState((q) => clampQuantity(q - 1))}
                aria-label="Decrease quantity"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/30 text-ink"
              >
                −
              </button>
              <span className="w-6 text-center font-body text-ink">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantityState((q) => clampQuantity(q + 1))}
                aria-label="Increase quantity"
                disabled={quantity >= MAX_LINE_QUANTITY}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/30 text-ink disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="mt-5 rounded-control border border-maroon/30 bg-maroon/5 px-4 py-3">
              {errors.map((error) => (
                <p key={error} className="font-body text-sm text-maroon">
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-ink/10 px-6 py-6">
          <PillButton type="button" onClick={handleConfirm} className="w-full">
            {mode === "edit" ? "Save changes" : "Add to order"} &middot;{" "}
            {formatPrice(effectiveUnitPrice * quantity)}
          </PillButton>
        </div>
      </div>
    </div>
  );
}
