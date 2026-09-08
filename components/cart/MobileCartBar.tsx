"use client";

import { useCart } from "@/lib/cart/CartContext";
import { formatPrice } from "@/lib/utils/formatPrice";
import { cn } from "@/lib/utils/cn";

/**
 * The header's own cart button is hidden on mobile (replaced by the "Menu"
 * hamburger, whose sheet has its own cart button inside) -- which meant
 * adding an item on mobile gave no on-page confirmation at all; you had to
 * open the hamburger menu to see the count changed. This is that missing
 * on-page confirmation: a bar that appears the moment the cart has
 * anything in it, everywhere on the site, without needing the drawer open.
 */
export function MobileCartBar() {
  const { count, subtotal, open } = useCart();
  const visible = count > 0;

  return (
    <div
      className={cn(
        "fixed inset-x-4 bottom-4 z-30 lg:hidden",
        "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
      aria-hidden={!visible}
    >
      <button
        type="button"
        onClick={open}
        className="flex w-full items-center justify-between gap-3 rounded-pill bg-ink px-6 py-4 font-body text-[15px] font-medium text-cream shadow-[0_16px_40px_-12px_rgba(59,42,29,0.6)]"
      >
        <span>
          {count} {count === 1 ? "item" : "items"} &middot; {formatPrice(subtotal)}
        </span>
        <span className="text-saffron">View order &rarr;</span>
      </button>
    </div>
  );
}
