import { formatPrice } from "@/lib/utils/formatPrice";
import { formatOrderTimestamp, formatPickupTime } from "@/lib/utils/formatAdminTime";
import { OrderActionBar } from "@/components/admin/OrderActionBar";
import type { AdminOrderSummary } from "@/lib/admin/orders";

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "New",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
  REFUNDED: "Refunded",
};

// Payment state (Stripe/Payment record) is deliberately shown separately
// from fulfillment state (Order.status) -- staff can see whether money was
// actually collected, but nothing here lets them change it. Only the
// Stripe webhook can ever move a Payment to SUCCEEDED.
const PAYMENT_LABEL: Record<string, { text: string; className: string }> = {
  SUCCEEDED: { text: "Paid", className: "text-green" },
  PENDING: { text: "Awaiting payment", className: "text-saffron" },
  FAILED: { text: "Payment failed", className: "text-maroon" },
  REFUNDED: { text: "Refunded", className: "text-ink/50" },
  PARTIALLY_REFUNDED: { text: "Partially refunded", className: "text-ink/50" },
};

export function OrderCard({
  order,
  timezone,
  canManage,
  showEmail = false,
}: {
  order: AdminOrderSummary;
  timezone: string;
  canManage: boolean;
  showEmail?: boolean;
}) {
  return (
    <div className="rounded-image border border-ink/15 bg-cream p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-display text-lg font-semibold text-ink">#{order.orderNumber}</div>
          <div className="mt-0.5 text-xs text-ink/50">
            Placed {formatOrderTimestamp(order.createdAt, timezone)} · Pickup{" "}
            {formatPickupTime(order.pickupType, order.requestedPickupTime, timezone)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-pill bg-ink/10 px-3 py-1 font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/70">
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
          <span
            className={`font-label text-[11px] font-medium uppercase tracking-[0.1em] ${
              order.paymentStatus
                ? PAYMENT_LABEL[order.paymentStatus].className
                : order.isPaid
                  ? "text-green"
                  : "text-maroon"
            }`}
          >
            {order.paymentStatus ? PAYMENT_LABEL[order.paymentStatus].text : order.isPaid ? "Paid" : "Unpaid"}
          </span>
        </div>
      </div>

      <div className="mt-3 text-sm text-ink/80">
        <div>{order.customerName}</div>
        <div className="text-ink/60">
          {order.customerPhone}
          {showEmail ? ` · ${order.customerEmail}` : ""}
        </div>
      </div>

      <ul className="mt-4 space-y-2 border-t border-ink/10 pt-4">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-start justify-between gap-4 text-sm">
            <div>
              <div className="text-ink">
                {item.quantity} &times; {item.itemName}
              </div>
              {item.modifiers.map((m, mi) => (
                <div key={mi} className="text-xs text-ink/50">
                  {m.groupName}: {m.name}
                </div>
              ))}
              {item.specialInstructions && (
                <div className="text-xs italic text-ink/50">Note: {item.specialInstructions}</div>
              )}
            </div>
            <span className="shrink-0 text-ink/70">{formatPrice(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      {order.specialInstructions && (
        <p className="mt-3 rounded-control bg-peach/40 px-3 py-2 text-xs italic text-ink/70">
          Order note: {order.specialInstructions}
        </p>
      )}

      <div className="mt-4 border-t border-ink/10 pt-3 text-sm">
        <div className="flex justify-between text-ink/60">
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-ink/60">
            <span>Discount{order.promotionCode ? ` (${order.promotionCode})` : ""}</span>
            <span>-{formatPrice(order.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-ink/60">
          <span>Tax</span>
          <span>{formatPrice(order.taxAmount)}</span>
        </div>
        <div className="flex justify-between font-medium text-ink">
          <span>Total</span>
          <span>{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {canManage && <OrderActionBar orderId={order.id} actions={order.actions} />}
    </div>
  );
}
