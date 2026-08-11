"use client";

import { useCart } from "@/lib/cart/CartContext";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/formatPrice";
import { PillButton } from "@/components/ui/PillButton";

export function CartDrawer() {
  const { lines, subtotal, isOpen, close, setQuantity, remove } = useCart();

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
        className={cn(
          "absolute right-0 top-0 flex h-full w-[88%] max-w-md flex-col bg-cream shadow-[0_0_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
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
            <p className="font-body text-ink/60">
              Nothing here yet. Add a dish or a sweet from the menu to get started.
            </p>
          ) : (
            <ul className="flex flex-col gap-6">
              {lines.map((line) => (
                <li key={line.itemId} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-body text-[15px] font-medium text-ink">{line.name}</p>
                    <p className="mt-1 font-body text-sm text-ink/60">{formatPrice(line.price)} each</p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.itemId, line.quantity - 1)}
                        aria-label={`Decrease quantity of ${line.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/30 text-ink"
                      >
                        −
                      </button>
                      <span className="w-4 text-center font-body text-sm text-ink">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.itemId, line.quantity + 1)}
                        aria-label={`Increase quantity of ${line.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/30 text-ink"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(line.itemId)}
                        className="ml-2 font-label text-[11px] uppercase tracking-[0.15em] text-ink/50 transition-colors hover:text-maroon"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <span className="shrink-0 font-body text-[15px] text-ink">{formatPrice(line.lineTotal)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-ink/10 px-6 py-6">
            <div className="flex items-center justify-between font-body text-lg text-ink">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 font-body text-xs text-ink/50">Pickup only. Tax calculated at pickup.</p>
            <PillButton href="/checkout" onClick={close} className="mt-4 w-full">
              Checkout
            </PillButton>
          </div>
        )}
      </div>
    </div>
  );
}
