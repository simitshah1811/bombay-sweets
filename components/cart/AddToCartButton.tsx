"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { cn } from "@/lib/utils/cn";

const variantClasses = {
  filled: "bg-saffron text-cream hover:bg-ink",
  ghost: "border border-ink/70 text-ink bg-transparent hover:bg-ink hover:text-cream",
  ghostOnDark: "border border-cream/70 text-cream bg-transparent hover:bg-cream hover:text-ink",
} as const;

export function AddToCartButton({
  itemId,
  variant = "filled",
  size = "default",
  className,
}: {
  itemId: string;
  variant?: keyof typeof variantClasses;
  size?: "default" | "compact";
  className?: string;
}) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    add(itemId, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  }

  if (size === "compact") {
    return (
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
    );
  }

  return (
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
}
