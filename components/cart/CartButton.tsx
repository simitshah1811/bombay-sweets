"use client";

import { PillButton } from "@/components/ui/PillButton";
import { useCart } from "@/lib/cart/CartContext";

export function CartButton({
  variant = "filled",
  className,
}: {
  variant?: "filled" | "ghost" | "ghostOnDark";
  className?: string;
}) {
  const { count, open } = useCart();

  return (
    <PillButton type="button" onClick={open} variant={variant} className={className}>
      {count > 0 ? `Order (${count})` : "Order"}
    </PillButton>
  );
}
