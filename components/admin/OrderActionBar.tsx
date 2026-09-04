"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { OrderStatus } from "@/lib/generated/prisma/client";
import type { AdminOrderAction } from "@/lib/admin/orders";

const ACTION_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAID: "Paid",
  ACCEPTED: "Accept",
  PREPARING: "Start Preparing",
  READY: "Mark Ready",
  COMPLETED: "Complete",
  CANCELLED: "Cancel",
  REJECTED: "Reject",
  REFUNDED: "Refund",
};

// REJECTED/CANCELLED are the only destructive-feeling actions today, but
// this is purely a visual cue -- whether a reason is actually required
// comes from action.reasonRequired (sourced from the lifecycle engine),
// never from this style map.
const DESTRUCTIVE: Partial<Record<OrderStatus, boolean>> = { REJECTED: true, CANCELLED: true };

export function OrderActionBar({ orderId, actions }: { orderId: string; actions: AdminOrderAction[] }) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<AdminOrderAction | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(targetStatus: OrderStatus, reasonText: string | null) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus, reason: reasonText }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message ?? "That didn't work. Please try again.");
        setSubmitting(false);
        return;
      }
      setPendingAction(null);
      setReason("");
      setSubmitting(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  function handleClick(action: AdminOrderAction) {
    if (action.reasonRequired) {
      setPendingAction(action);
      setReason("");
      setError(null);
      return;
    }
    void submit(action.targetStatus, null);
  }

  if (actions.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <button
          key={action.targetStatus}
          type="button"
          disabled={submitting}
          onClick={() => handleClick(action)}
          className={cn(
            "rounded-pill px-4 py-2 font-label text-xs font-medium uppercase tracking-[0.1em] transition-colors disabled:opacity-50",
            DESTRUCTIVE[action.targetStatus]
              ? "border border-maroon/50 text-maroon hover:bg-maroon hover:text-cream"
              : "bg-ink text-cream hover:bg-saffron"
          )}
        >
          {ACTION_LABEL[action.targetStatus]}
        </button>
      ))}
      {error && !pendingAction && <p className="text-xs text-maroon">{error}</p>}

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6">
          <div className="w-full max-w-sm rounded-image border border-ink/15 bg-cream p-6">
            <h3 className="font-display text-lg font-semibold text-ink">
              {ACTION_LABEL[pendingAction.targetStatus]} this order?
            </h3>
            <p className="mt-1 text-sm text-ink/60">A reason is required for this action.</p>
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. Out of stock, customer requested cancellation…"
              className="mt-3 w-full rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
            />
            {error && <p className="mt-2 text-sm text-maroon">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={submitting}
                className="rounded-control border border-ink/20 px-4 py-2 text-sm text-ink/70 hover:bg-ink/5"
              >
                Never mind
              </button>
              <button
                type="button"
                disabled={submitting || !reason.trim()}
                onClick={() => submit(pendingAction.targetStatus, reason)}
                className="rounded-control bg-maroon px-4 py-2 text-sm font-medium text-cream disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
