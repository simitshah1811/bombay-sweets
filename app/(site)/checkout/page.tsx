"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { PillButton } from "@/components/ui/PillButton";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { formatPrice } from "@/lib/utils/formatPrice";
import { PickupTimePicker } from "@/components/checkout/PickupTimePicker";
import { CheckoutReview, type AppliedPromotion } from "@/components/checkout/CheckoutReview";
import type { PickupSlot } from "@/lib/pickup/schedule";

type Step = "form" | "review";

interface PickupAvailability {
  orderingEnabled: boolean;
  pickupEnabled: boolean;
  asapEnabled: boolean;
  scheduledEnabled: boolean;
  minPrepTimeMinutes: number;
  timezoneLabel: string;
  slots: PickupSlot[];
  promotionsEnabled: boolean;
}

export default function CheckoutPage() {
  const { lines, subtotal, taxRatePercent, clear } = useCart();

  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState<Step>("form");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [availability, setAvailability] = useState<PickupAvailability | null>(null);
  const [pickupType, setPickupType] = useState<"ASAP" | "SCHEDULED">("ASAP");
  const [selectedSlotValue, setSelectedSlotValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromotion | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [problemMessages, setProblemMessages] = useState<string[]>([]);

  useEffect(() => {
    // All pickup times come pre-built from the server, computed in the
    // restaurant's own timezone -- the browser never generates or adjusts
    // pickup times based on its own clock.
    let cancelled = false;
    fetch("/api/pickup/availability")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("availability request failed"))))
      .then((data: PickupAvailability) => {
        if (cancelled) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAvailability(data);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPickupType(data.asapEnabled ? "ASAP" : "SCHEDULED");
      })
      .catch(() => {
        // Leave availability unset -- the form shows a friendly "unavailable" state below.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const slots = availability?.slots ?? [];
  const pickupLabel = slots.find((slot) => slot.value === selectedSlotValue)?.label ?? "";

  const discountAmount = appliedPromo?.discountAmount ?? 0;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const reviewTax = taxRatePercent != null ? taxableSubtotal * (taxRatePercent / 100) : 0;
  const reviewTotal = taxableSubtotal + reviewTax;

  function handleContinueToReview(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setFormError("Please fill in your name, email, and phone number.");
      return;
    }
    if (pickupType === "SCHEDULED" && !selectedSlotValue) {
      setFormError("Please choose a pickup time.");
      return;
    }
    setStep("review");
  }

  async function handleApplyPromo() {
    if (!promoCodeInput.trim()) return;
    setPromoChecking(true);
    setPromoError(null);
    try {
      const response = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCodeInput.trim(), customerEmail: email.trim(), subtotal }),
      });
      const data = await response.json();
      if (data.ok) {
        setAppliedPromo({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmount: data.discountAmount,
        });
        setPromoError(null);
      } else {
        setAppliedPromo(null);
        setPromoError(data.message ?? "That promo code isn't valid.");
      }
    } catch {
      setPromoError("We couldn't check that code right now. Please try again.");
    } finally {
      setPromoChecking(false);
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError(null);
  }

  async function handlePlaceOrder() {
    setSubmitting(true);
    setSubmitError(null);
    setProblemMessages([]);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          customer: { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim() },
          pickup: {
            type: pickupType,
            requestedPickupTime: pickupType === "SCHEDULED" ? selectedSlotValue : null,
          },
          notes: notes.trim(),
          promoCode: appliedPromo?.code ?? null,
          lines: lines.map((line) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            modifierOptionIds: line.modifiers.map((m) => m.modifierOptionId),
            specialInstructions: line.specialInstructions,
            expectedUnitPrice: line.unitPrice,
            expectedModifierPrices: Object.fromEntries(line.modifiers.map((m) => [m.modifierOptionId, m.priceAdjustment])),
          })),
        }),
      });

      const data = await response.json();

      if (data.ok) {
        // Order now exists server-side as PENDING_PAYMENT. Payment isn't
        // real until Stripe's webhook confirms it -- this redirect is not
        // itself proof of anything, it's just the handoff to Stripe's
        // hosted, secure Checkout page.
        const sessionResponse = await fetch(`/api/orders/${data.order.id}/checkout-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackingToken: data.order.trackingToken }),
        });
        const sessionData = await sessionResponse.json();

        if (sessionData.ok && sessionData.url) {
          // The order is durably saved server-side regardless of what
          // happens next, so the cart is cleared now -- if payment is
          // abandoned or cancelled, this specific order simply stays
          // PENDING_PAYMENT (visible in admin history, never fulfillable)
          // rather than the customer ending up with a half-cleared cart.
          clear();
          window.location.href = sessionData.url;
          return;
        }

        setSubmitError(sessionData.message ?? "We couldn't start payment. Please try again.");
        return;
      }

      if (data.code === "PICKUP_INVALID") {
        setStep("form");
        setFormError(data.message);
        return;
      }

      if (data.code === "PROMO_INVALID") {
        setAppliedPromo(null);
        setPromoError(data.message);
        return;
      }

      setSubmitError(data.message ?? "We couldn't place your order. Please try again.");
      setProblemMessages(Array.isArray(data.problems) ? data.problems : []);
    } catch {
      setSubmitError("We couldn't reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 lg:px-10">
        <Eyebrow>Checkout</Eyebrow>
        <h1 className="mt-4 font-display text-[40px] leading-[0.95] text-ink lg:text-[56px]">Pickup order</h1>
        <div className="mt-10 rounded-image border border-ink/10 bg-peach/40 p-6">
          <p className="font-body text-ink/70">Your cart is empty.</p>
          <PillButton href="/menu" className="mt-4">
            Browse the menu
          </PillButton>
        </div>
      </div>
    );
  }

  const orderingClosed = availability !== null && (!availability.orderingEnabled || !availability.pickupEnabled);

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
      <div>
        <Eyebrow>Checkout</Eyebrow>
        <h1 className="mt-4 font-display text-[40px] leading-[0.95] text-ink lg:text-[56px]">Pickup order</h1>
        <p className="mt-4 max-w-md font-body text-ink/60">
          We&rsquo;re pickup-only for now &mdash; no delivery. Tell us who&rsquo;s picking up and when, and
          we&rsquo;ll have it ready.
        </p>

        {orderingClosed ? (
          <div className="mt-10 rounded-image border border-ink/10 bg-peach/40 p-6">
            <p className="font-body text-ink/70">
              We&rsquo;re not accepting online orders right now. Please call us to order.
            </p>
          </div>
        ) : step === "form" ? (
          <form onSubmit={handleContinueToReview} className="mt-10 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="font-label text-xs uppercase tracking-[0.15em] text-ink/60">First name</span>
                <input
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="rounded-control border border-ink/20 bg-transparent px-4 py-3 font-body text-ink outline-none focus:border-ink/60"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-label text-xs uppercase tracking-[0.15em] text-ink/60">Last name</span>
                <input
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="rounded-control border border-ink/20 bg-transparent px-4 py-3 font-body text-ink outline-none focus:border-ink/60"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-[0.15em] text-ink/60">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-control border border-ink/20 bg-transparent px-4 py-3 font-body text-ink outline-none focus:border-ink/60"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-[0.15em] text-ink/60">Phone</span>
              <input
                required
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="For pickup updates"
                className="rounded-control border border-ink/20 bg-transparent px-4 py-3 font-body text-ink outline-none focus:border-ink/60"
              />
            </label>

            {availability && (
              <PickupTimePicker
                asapEnabled={availability.asapEnabled}
                scheduledEnabled={availability.scheduledEnabled}
                pickupType={pickupType}
                onPickupTypeChange={setPickupType}
                slots={slots}
                slotsLoading={false}
                selectedSlotValue={selectedSlotValue}
                onSlotChange={setSelectedSlotValue}
                timezoneLabel={availability.timezoneLabel}
              />
            )}

            <label className="flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-[0.15em] text-ink/60">
                Notes <span className="normal-case text-ink/40">(optional)</span>
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value.slice(0, 1000))}
                rows={3}
                placeholder="Anything we should know?"
                className="rounded-control border border-ink/20 bg-transparent px-4 py-3 font-body text-ink outline-none focus:border-ink/60"
              />
            </label>

            {formError && <p className="font-body text-sm text-maroon">{formError}</p>}

            <PillButton type="submit" className="w-fit">
              Continue to review
            </PillButton>
          </form>
        ) : (
          <div className="mt-10">
            <CheckoutReview
              customer={{ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim() }}
              pickupType={pickupType}
              pickupLabel={pickupLabel}
              notes={notes.trim()}
              lines={lines}
              subtotal={subtotal}
              discountAmount={discountAmount}
              tax={reviewTax}
              total={reviewTotal}
              taxRatePercent={taxRatePercent}
              promotionsEnabled={availability?.promotionsEnabled ?? false}
              promoCodeInput={promoCodeInput}
              onPromoCodeInputChange={setPromoCodeInput}
              onApplyPromo={handleApplyPromo}
              onRemovePromo={handleRemovePromo}
              appliedPromo={appliedPromo}
              promoChecking={promoChecking}
              promoError={promoError}
              onBack={() => setStep("form")}
              onConfirm={handlePlaceOrder}
              submitting={submitting}
              errorMessage={submitError}
              problemMessages={problemMessages}
            />
          </div>
        )}
      </div>

      {step === "form" && (
        <div className="h-fit rounded-image border border-ink/10 bg-peach/40 p-6">
          <h2 className="font-display text-2xl text-ink">Your order</h2>
          <ul className="mt-5 flex flex-col gap-4">
            {lines.map((line) => (
              <li key={line.lineId} className="flex items-baseline justify-between gap-4 font-body text-ink">
                <span>
                  {line.quantity} &times; {line.itemName}
                </span>
                <span>{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-baseline justify-between border-t border-ink/10 pt-4 font-body text-lg text-ink">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-3 font-body text-xs text-ink/50">Estimated &mdash; final pricing confirmed at checkout.</p>
        </div>
      )}
    </div>
  );
}
