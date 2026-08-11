"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { formatPrice } from "@/lib/utils/formatPrice";
import { PillButton } from "@/components/ui/PillButton";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { business } from "@/data/business";
import { getPickupSlots, type PickupSlot } from "@/lib/cart/pickupSlots";
import { generateOrderNumber } from "@/lib/cart/orderNumber";

interface ConfirmedOrder {
  orderNumber: string;
  name: string;
  pickupLabel: string;
  notes: string;
  lines: { itemId: string; name: string; quantity: number; lineTotal: number }[];
  subtotal: number;
}

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupValue, setPickupValue] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null);

  useEffect(() => {
    // One-time read of the current time to build pickup slots; can't run during SSR render.
    const generated = getPickupSlots();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlots(generated);
    setPickupValue((current) => current || generated[0]?.value || "");
  }, []);

  const canSubmit = name.trim().length > 1 && phone.trim().length > 6 && pickupValue.length > 0 && lines.length > 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    const pickupLabel = slots.find((slot) => slot.value === pickupValue)?.label ?? "as soon as possible";
    setConfirmed({
      orderNumber: generateOrderNumber(),
      name: name.trim(),
      pickupLabel,
      notes: notes.trim(),
      lines: lines.map((line) => ({
        itemId: line.itemId,
        name: line.name,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      })),
      subtotal,
    });
    clear();
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 lg:px-10">
        <Eyebrow>Order received</Eyebrow>
        <h1 className="mt-4 font-display text-[40px] leading-[0.95] text-ink lg:text-[56px]">
          Thanks, {confirmed.name.split(" ")[0]}.
        </h1>
        <p className="mt-4 font-body text-lg text-ink/70">
          Order <span className="text-ink">{confirmed.orderNumber}</span> is set for pickup{" "}
          {confirmed.pickupLabel.toLowerCase()} at {business.addressLine}.
        </p>

        <div className="mt-8 rounded-image border border-ink/10 bg-peach/40 p-6">
          <ul className="flex flex-col gap-3">
            {confirmed.lines.map((line) => (
              <li key={line.itemId} className="flex items-baseline justify-between gap-4 font-body text-ink">
                <span>
                  {line.quantity} × {line.name}
                </span>
                <span>{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-ink/10 pt-4 font-body text-lg text-ink">
            <span>Subtotal</span>
            <span>{formatPrice(confirmed.subtotal)}</span>
          </div>
          {confirmed.notes && (
            <p className="mt-4 border-t border-ink/10 pt-4 font-body text-sm text-ink/60">
              Note: {confirmed.notes}
            </p>
          )}
        </div>

        <p className="mt-6 font-body text-sm text-ink/50">
          This is a preview of our online ordering experience — this order was not sent to the restaurant
          and no payment was taken. To place a real order right now, call{" "}
          <a href={business.phoneHref} className="text-ink underline">
            {business.phone}
          </a>
          .
        </p>

        <PillButton href="/menu" className="mt-8">
          Back to the menu
        </PillButton>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
      <div>
        <Eyebrow>Checkout</Eyebrow>
        <h1 className="mt-4 font-display text-[40px] leading-[0.95] text-ink lg:text-[56px]">
          Pickup order
        </h1>
        <p className="mt-4 max-w-md font-body text-ink/60">
          We&rsquo;re pickup-only for now — no delivery. Tell us who&rsquo;s picking up and when, and
          we&rsquo;ll have it ready.
        </p>

        {lines.length === 0 ? (
          <div className="mt-10 rounded-image border border-ink/10 bg-peach/40 p-6">
            <p className="font-body text-ink/70">Your cart is empty.</p>
            <PillButton href="/menu" className="mt-4">
              Browse the menu
            </PillButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
            <label className="flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-[0.15em] text-ink/60">Name</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
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

            <label className="flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-[0.15em] text-ink/60">Pickup time</span>
              <select
                required
                value={pickupValue}
                onChange={(event) => setPickupValue(event.target.value)}
                className="rounded-control border border-ink/20 bg-transparent px-4 py-3 font-body text-ink outline-none focus:border-ink/60"
              >
                {slots.length === 0 && <option value="">Loading times…</option>}
                {slots.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-[0.15em] text-ink/60">
                Notes <span className="normal-case text-ink/40">(optional)</span>
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Anything we should know?"
                className="rounded-control border border-ink/20 bg-transparent px-4 py-3 font-body text-ink outline-none focus:border-ink/60"
              />
            </label>

            <PillButton type="submit" disabled={!canSubmit} className="w-fit disabled:opacity-40">
              Place order
            </PillButton>
          </form>
        )}
      </div>

      {lines.length > 0 && (
        <div className="h-fit rounded-image border border-ink/10 bg-peach/40 p-6">
          <h2 className="font-display text-2xl text-ink">Your order</h2>
          <ul className="mt-5 flex flex-col gap-4">
            {lines.map((line) => (
              <li key={line.itemId} className="flex items-baseline justify-between gap-4 font-body text-ink">
                <span>
                  {line.quantity} × {line.name}
                </span>
                <span>{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-baseline justify-between border-t border-ink/10 pt-4 font-body text-lg text-ink">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-3 font-body text-xs text-ink/50">Tax calculated at pickup. No payment due online.</p>
        </div>
      )}
    </div>
  );
}
