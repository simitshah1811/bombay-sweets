"use client";

import { formatPrice } from "@/lib/utils/formatPrice";
import { PillButton } from "@/components/ui/PillButton";
import type { CartLine } from "@/lib/cart/CartContext";

export interface AppliedPromotion {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  discountAmount: number;
}

export function CheckoutReview({
  customer,
  pickupType,
  pickupLabel,
  notes,
  lines,
  subtotal,
  discountAmount,
  tax,
  total,
  taxRatePercent,
  promotionsEnabled,
  promoCodeInput,
  onPromoCodeInputChange,
  onApplyPromo,
  onRemovePromo,
  appliedPromo,
  promoChecking,
  promoError,
  onBack,
  onConfirm,
  submitting,
  errorMessage,
  problemMessages,
}: {
  customer: { firstName: string; lastName: string; email: string; phone: string };
  pickupType: "ASAP" | "SCHEDULED";
  pickupLabel: string;
  notes: string;
  lines: CartLine[];
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  taxRatePercent: number | null;
  /** Whole promo section is hidden when false (e.g. always false in Production -- see lib/orders/validatePromotion.ts). */
  promotionsEnabled: boolean;
  promoCodeInput: string;
  onPromoCodeInputChange: (value: string) => void;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
  appliedPromo: AppliedPromotion | null;
  promoChecking: boolean;
  promoError: string | null;
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
  errorMessage: string | null;
  problemMessages: string[];
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className="font-label text-xs uppercase tracking-[0.15em] text-ink/60">Pickup Order</span>
        <h2 className="mt-2 font-display text-3xl text-ink lg:text-4xl">Review your order</h2>
      </div>

      <section>
        <h3 className="font-label text-xs uppercase tracking-[0.15em] text-ink/60">Customer</h3>
        <p className="mt-2 font-body text-ink">
          {customer.firstName} {customer.lastName}
        </p>
        <p className="font-body text-sm text-ink/60">{customer.email}</p>
        <p className="font-body text-sm text-ink/60">{customer.phone}</p>
      </section>

      <section>
        <h3 className="font-label text-xs uppercase tracking-[0.15em] text-ink/60">Pickup</h3>
        <p className="mt-2 font-body text-ink">
          {pickupType === "ASAP" ? "As soon as possible" : pickupLabel}
        </p>
        {notes && <p className="mt-1 font-body text-sm text-ink/60">Note: {notes}</p>}
      </section>

      <section>
        <h3 className="font-label text-xs uppercase tracking-[0.15em] text-ink/60">Items</h3>
        <ul className="mt-3 flex flex-col gap-4">
          {lines.map((line) => (
            <li key={line.lineId} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-body text-ink">
                  {line.quantity} &times; {line.itemName}
                </p>
                {line.modifiers.map((modifier) => (
                  <p key={modifier.modifierOptionId} className="mt-0.5 font-body text-sm text-ink/60">
                    {modifier.groupName} &mdash; {modifier.name}
                  </p>
                ))}
                {line.specialInstructions && (
                  <p className="mt-0.5 font-body text-sm italic text-ink/60">Note: {line.specialInstructions}</p>
                )}
              </div>
              <span className="shrink-0 font-body text-ink">{formatPrice(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
      </section>

      {promotionsEnabled && (
      <section className="border-t border-ink/10 pt-4">
        <span className="font-label text-xs uppercase tracking-[0.15em] text-ink/60">Promo code</span>
        {appliedPromo ? (
          <div className="mt-2 flex items-center justify-between rounded-control border border-ink/20 px-4 py-3">
            <span className="font-body text-sm text-ink">{appliedPromo.code} applied</span>
            <button
              type="button"
              onClick={onRemovePromo}
              className="font-label text-[11px] uppercase tracking-[0.15em] text-ink/50 transition-colors hover:text-maroon"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              value={promoCodeInput}
              onChange={(event) => onPromoCodeInputChange(event.target.value)}
              placeholder="Enter code"
              className="flex-1 rounded-control border border-ink/20 bg-transparent px-4 py-3 font-body text-ink outline-none focus:border-ink/60"
            />
            <PillButton
              type="button"
              variant="ghost"
              onClick={onApplyPromo}
              disabled={promoChecking || !promoCodeInput.trim()}
              className="disabled:opacity-50"
            >
              {promoChecking ? "Checking…" : "Apply"}
            </PillButton>
          </div>
        )}
        {promoError && <p className="mt-1 font-body text-sm text-maroon">{promoError}</p>}
      </section>
      )}

      <section className="border-t border-ink/10 pt-4">
        <div className="flex items-center justify-between font-body text-ink">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="mt-1 flex items-center justify-between font-body text-sm text-ink">
            <span>Discount{appliedPromo ? ` (${appliedPromo.code})` : ""}</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        {taxRatePercent != null && taxRatePercent > 0 && (
          <div className="mt-1 flex items-center justify-between font-body text-sm text-ink/60">
            <span>Estimated tax ({taxRatePercent}%)</span>
            <span>{formatPrice(tax)}</span>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between font-body text-lg text-ink">
          <span>Final total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-control border border-maroon/30 bg-maroon/5 px-4 py-3">
          <p className="font-body text-sm text-maroon">{errorMessage}</p>
          {problemMessages.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {problemMessages.map((message) => (
                <li key={message} className="font-body text-sm text-maroon">
                  {message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <PillButton type="button" variant="ghost" onClick={onBack} disabled={submitting}>
          Back
        </PillButton>
        <PillButton type="button" onClick={onConfirm} disabled={submitting} className="flex-1 disabled:opacity-50">
          {submitting ? "Redirecting to secure payment…" : `Continue to payment · ${formatPrice(total)}`}
        </PillButton>
      </div>
    </div>
  );
}
