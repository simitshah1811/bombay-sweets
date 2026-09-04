"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart, type CartLineModifier } from "@/lib/cart/CartContext";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/formatPrice";
import { PillButton } from "@/components/ui/PillButton";
import { PrepBadge } from "@/components/ui/Badge";
import { ItemCustomizeModal } from "@/components/cart/ItemCustomizeModal";

function groupModifiers(modifiers: CartLineModifier[]): { groupName: string; names: string[] }[] {
  const byGroup = new Map<string, string[]>();
  for (const modifier of modifiers) {
    const names = byGroup.get(modifier.groupName) ?? [];
    names.push(modifier.name);
    byGroup.set(modifier.groupName, names);
  }
  return Array.from(byGroup.entries()).map(([groupName, names]) => ({ groupName, names }));
}

export function CartDrawer() {
  const {
    lines,
    subtotal,
    estimatedTax,
    estimatedTotal,
    taxRatePercent,
    isOpen,
    close,
    setQuantity,
    remove,
    updateLine,
    menuItemsById,
  } = useCart();
  const [editingLineId, setEditingLineId] = useState<string | null>(null);

  const editingLine = lines.find((line) => line.lineId === editingLineId);
  const liveEditingItem = editingLine ? menuItemsById?.[editingLine.itemId] : undefined;

  return (
    <div
      className={cn("fixed inset-0 z-50", isOpen ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!isOpen}
    >
      <div
        onClick={close}
        className={cn(
          "absolute inset-0 bg-ink/30 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        className="absolute right-0 top-0 flex h-full w-[92%] max-w-md flex-col bg-cream shadow-[0_0_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-6">
          <h2 className="font-display text-2xl text-ink">Your order</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="rounded-full border border-ink/30 p-2 text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="font-display text-2xl text-ink">Your cart is empty.</p>
              <p className="max-w-[26ch] font-body text-ink/60">
                Explore our menu and add something delicious.
              </p>
              <PillButton href="/menu" onClick={close} className="mt-2">
                Browse Menu
              </PillButton>
            </div>
          ) : (
            <ul className="flex flex-col gap-6">
              {lines.map((line) => {
                const liveItem = menuItemsById?.[line.itemId];
                const canEdit = Boolean(liveItem?.isAvailable);
                return (
                  <li key={line.lineId} className="flex items-start gap-3">
                    {liveItem?.imageUrl && (
                      <Image
                        src={liveItem.imageUrl}
                        alt=""
                        width={56}
                        height={56}
                        className="h-14 w-14 shrink-0 rounded-control object-cover"
                      />
                    )}
                    <div className="flex flex-1 items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-body text-[15px] font-medium text-ink">{line.itemName}</p>

                        {liveItem && (
                          <PrepBadge
                            status={liveItem.preparationStatus}
                            minutes={liveItem.preparationMinutes}
                            className="mt-1"
                          />
                        )}

                        {groupModifiers(line.modifiers).map((group) => (
                          <p key={group.groupName} className="mt-1 font-body text-sm text-ink/60">
                            {group.groupName} &mdash; {group.names.join(", ")}
                          </p>
                        ))}

                        {line.specialInstructions && (
                          <p className="mt-1 font-body text-sm italic text-ink/60">
                            Note: {line.specialInstructions}
                          </p>
                        )}

                        <p className="mt-1 font-body text-sm text-ink/60">
                          {formatPrice(line.effectiveUnitPrice)} &times; {line.quantity}
                        </p>

                        {!line.isAvailable && (
                          <p className="mt-1 font-label text-[11px] uppercase tracking-[0.15em] text-maroon">
                            Currently unavailable
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setQuantity(line.lineId, line.quantity - 1)}
                            aria-label={`Decrease quantity of ${line.itemName}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/30 text-ink"
                          >
                            &minus;
                          </button>
                          <span className="w-4 text-center font-body text-sm text-ink">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(line.lineId, line.quantity + 1)}
                            aria-label={`Increase quantity of ${line.itemName}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/30 text-ink"
                          >
                            +
                          </button>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => setEditingLineId(line.lineId)}
                              className="font-label text-[11px] uppercase tracking-[0.15em] text-ink/50 transition-colors hover:text-ink"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => remove(line.lineId)}
                            className="font-label text-[11px] uppercase tracking-[0.15em] text-ink/50 transition-colors hover:text-maroon"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <span className="shrink-0 font-body text-[15px] text-ink">{formatPrice(line.lineTotal)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-ink/10 px-6 py-6">
            <div className="flex items-center justify-between font-body text-ink">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {taxRatePercent != null && taxRatePercent > 0 && (
              <div className="mt-1.5 flex items-center justify-between font-body text-sm text-ink/60">
                <span>Estimated tax ({taxRatePercent}%)</span>
                <span>{formatPrice(estimatedTax)}</span>
              </div>
            )}
            <div className="mt-1.5 flex items-center justify-between font-body text-lg text-ink">
              <span>Estimated total</span>
              <span>{formatPrice(estimatedTotal)}</span>
            </div>
            <p className="mt-2 font-body text-xs text-ink/50">
              Pickup only. Estimate only &mdash; final pricing and availability are confirmed at checkout.
            </p>
            <PillButton href="/checkout" onClick={close} className="mt-4 w-full">
              Checkout
            </PillButton>
          </div>
        )}
      </div>

      {editingLine && liveEditingItem && (
        <ItemCustomizeModal
          item={{
            id: liveEditingItem.id,
            name: liveEditingItem.name,
            price: liveEditingItem.price,
            modifierGroups: liveEditingItem.modifierGroups,
            preparationStatus: liveEditingItem.preparationStatus,
            preparationMinutes: liveEditingItem.preparationMinutes,
          }}
          mode="edit"
          initialQuantity={editingLine.quantity}
          initialModifierOptionIds={editingLine.modifiers.map((m) => m.modifierOptionId)}
          initialSpecialInstructions={editingLine.specialInstructions}
          onConfirm={(result) => {
            updateLine(editingLine.lineId, {
              itemName: liveEditingItem.name,
              unitPrice: liveEditingItem.price,
              modifiers: result.modifiers,
              specialInstructions: result.specialInstructions,
              quantity: result.quantity,
            });
            setEditingLineId(null);
          }}
          onClose={() => setEditingLineId(null)}
        />
      )}
    </div>
  );
}
