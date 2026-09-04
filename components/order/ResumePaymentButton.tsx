"use client";

import { useState } from "react";
import { PillButton } from "@/components/ui/PillButton";

/**
 * Reuses the exact same idempotent Stripe Checkout Session endpoint from
 * Phase 8 -- if a still-open session exists for this order it's reused,
 * otherwise a fresh one is created. No new payment logic lives here.
 */
export function ResumePaymentButton({ orderId, token }: { orderId: string; token: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingToken: token }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.message ?? "We couldn't resume payment. Please try again.");
    } catch {
      setError("We couldn't reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PillButton type="button" onClick={handleClick} disabled={submitting}>
        {submitting ? "Redirecting…" : "Resume payment"}
      </PillButton>
      {error && <p className="mt-2 font-body text-sm text-maroon">{error}</p>}
    </div>
  );
}
