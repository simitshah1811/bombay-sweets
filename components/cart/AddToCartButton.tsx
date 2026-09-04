"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { cn } from "@/lib/utils/cn";
import type { ModifierGroupForDisplay } from "@/lib/menu/queries";
import type { PreparationStatus } from "@/lib/generated/prisma/client";
import { ItemCustomizeModal, type CustomizeConfirmResult } from "@/components/cart/ItemCustomizeModal";

const variantClasses = {
  filled: "bg-saffron text-cream hover:bg-ink",
  ghost: "border border-ink/70 text-ink bg-transparent hover:bg-ink hover:text-cream",
  ghostOnDark: "border border-cream/70 text-cream bg-transparent hover:bg-cream hover:text-ink",
} as const;

export function AddToCartButton({
  itemId,
  itemName,
  price,
  modifierGroups = [],
  preparationStatus,
  preparationMinutes = null,
  variant = "filled",
  size = "default",
  className,
}: {
  itemId: string;
  itemName: string;
  price: number;
  modifierGroups?: ModifierGroupForDisplay[];
  preparationStatus?: PreparationStatus;
  preparationMinutes?: number | null;
  variant?: keyof typeof variantClasses;
  size?: "default" | "compact";
  className?: string;
}) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [customizing, setCustomizing] = useState(false);

  function flashAdded() {
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (modifierGroups.length > 0) {
      setCustomizing(true);
      return;
    }
    add({ itemId, itemName, unitPrice: price, modifiers: [], specialInstructions: "", quantity: 1 });
    flashAdded();
  }

  function handleConfirm(result: CustomizeConfirmResult) {
    add({
      itemId,
      itemName,
      unitPrice: price,
      modifiers: result.modifiers,
      specialInstructions: result.specialInstructions,
      quantity: result.quantity,
    });
    setCustomizing(false);
    flashAdded();
  }

  const buttonEl =
    size === "compact" ? (
      <button
        type="button"
        onClick={handleClick}
        aria-label="Add to order"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-body text-lg leading-none transition-colors duration-200",
          variantClasses[variant],
          className
        )}
      >
        {justAdded ? "✓" : "+"}
      </button>
    ) : (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill px-6 py-3.5 font-body text-[15px] font-medium leading-none transition-colors duration-200",
          variantClasses[variant],
          className
        )}
      >
        {justAdded ? "Added" : "Add to order"}
      </button>
    );

  return (
    <>
      {buttonEl}
      {customizing && (
        <ItemCustomizeModal
          item={{ id: itemId, name: itemName, price, modifierGroups, preparationStatus, preparationMinutes }}
          mode="add"
          onConfirm={handleConfirm}
          onClose={() => setCustomizing(false)}
        />
      )}
    </>
  );
}
