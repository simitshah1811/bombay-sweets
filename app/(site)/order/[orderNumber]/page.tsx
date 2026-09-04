import { PillButton } from "@/components/ui/PillButton";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { formatPrice } from "@/lib/utils/formatPrice";
import { getOrderForTracking, type CustomerOrderView } from "@/lib/orders/getOrderForTracking";
import { getOperationalContext, getTimezoneDisplayName } from "@/lib/pickup/schedule";
import { OrderStatusTimeline } from "@/components/order/OrderStatusTimeline";
import { OrderTrackingPoll } from "@/components/order/OrderTrackingPoll";
import { ResumePaymentButton } from "@/components/order/ResumePaymentButton";
import { business } from "@/data/business";
import type { OrderStatus, PaymentStatus } from "@/lib/generated/prisma/client";

export const metadata = { title: "Order status" };

// Customer-friendly labels only -- the underlying state machine is still
// lib/orders/orderLifecycle.ts. This is presentation, not a second
// state machine: every label is a pure function of the one real status.
const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Payment pending",
  PAID: "Order received",
  ACCEPTED: "Order accepted",
  PREPARING: "Preparing your order",
  READY: "Ready for pickup",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Restaurant unable to accept order",
  REFUNDED: "Refunded",
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Payment pending",
  SUCCEEDED: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
};

// Only these statuses have a real position on the fulfillment timeline.
// CANCELLED/REJECTED/REFUNDED are terminal-but-off-the-happy-path and get
// their own distinct messaging instead of a broken partial progress bar.
const PROGRESS_INDEX: Partial<Record<OrderStatus, number>> = {
  PENDING_PAYMENT: 0,
  PAID: 1,
  ACCEPTED: 2,
  PREPARING: 3,
  READY: 4,
  COMPLETED: 5,
};

const TERMINAL_STATUSES: OrderStatus[] = ["COMPLETED", "CANCELLED", "REJECTED", "REFUNDED"];

function formatPickupTime(order: CustomerOrderView, timezone: string): string {
  if (order.pickupType === "ASAP" || !order.requestedPickupTime) return "As soon as possible";
  const time = new Date(order.requestedPickupTime).toLocaleString("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${time} ${getTimezoneDisplayName(timezone, new Date(order.requestedPickupTime))}`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-xl px-6 py-24 lg:px-10">{children}</div>;
}

export default async function OrderTrackingPage(props: PageProps<"/order/[orderNumber]">) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const token = typeof searchParams.token === "string" ? searchParams.token : undefined;

  const result = await getOrderForTracking(params.orderNumber, token);

  if (!result.ok) {
    return (
      <Shell>
        <Eyebrow>Order status</Eyebrow>
        <h1 className="mt-4 font-display text-[32px] text-ink">We couldn&rsquo;t find that order.</h1>
        <p className="mt-4 font-body text-ink/60">
          Double-check the link from your confirmation, or call us at{" "}
          <a href={business.phoneHref} className="text-ink underline">
            {business.phone}
          </a>
          .
        </p>
      </Shell>
    );
  }

  const order = result.order;
  const context = await getOperationalContext();
  const timezone = context?.timezone ?? "America/Los_Angeles";
  const isTerminal = TERMINAL_STATUSES.includes(order.status);

  // Cancelled / rejected: distinct, standalone messaging -- never a
  // partially-filled progress timeline that implies more happened than
  // actually did.
  if (order.status === "CANCELLED" || order.status === "REJECTED") {
    return (
      <Shell>
        <Eyebrow>Order #{order.orderNumber}</Eyebrow>
        <h1 className="mt-4 font-display text-[32px] text-ink">
          {order.status === "CANCELLED" ? "Order cancelled" : "Restaurant unable to accept order"}
        </h1>
        <p className="mt-4 font-body text-ink/70">
          {order.status === "CANCELLED"
            ? "This order was cancelled and will not be prepared."
            : "The restaurant wasn't able to accept this order."}
        </p>
        {/* Never claim a refund happened unless a real refund record exists -- none does in this system yet, so this is deliberately never stated here. */}
        {order.paymentStatus === "SUCCEEDED" && (
          <p className="mt-2 font-body text-sm text-ink/60">
            If you were charged, please call us at{" "}
            <a href={business.phoneHref} className="text-ink underline">
              {business.phone}
            </a>{" "}
            and we&rsquo;ll take care of it.
          </p>
        )}
        <PillButton href="/menu" className="mt-8">
          Start a new order
        </PillButton>
      </Shell>
    );
  }

  // Still PENDING_PAYMENT: payment truly hasn't happened. Never implies
  // acceptance, preparing, or readiness -- those are all fulfillment
  // states that can only follow a verified payment.
  if (order.status === "PENDING_PAYMENT") {
    return (
      <Shell>
        {!isTerminal && <OrderTrackingPoll />}
        <Eyebrow>Order #{order.orderNumber}</Eyebrow>
        <h1 className="mt-4 font-display text-[32px] text-ink">Payment pending</h1>
        <p className="mt-4 font-body text-ink/70">
          Your order has been created, but payment hasn&rsquo;t been completed yet. Nothing has been charged and the
          restaurant hasn&rsquo;t started on it.
        </p>
        {order.hasPaymentRecord && (
          <div className="mt-6">
            {/* Non-null assertion is safe here: getOrderForTracking only
                returns {ok:true} when the presented token matched the
                order's stored hash, which can't happen if token were
                undefined. */}
            <ResumePaymentButton orderId={order.id} token={token!} />
          </div>
        )}
        <div className="mt-8 rounded-image border border-ink/10 bg-peach/40 p-6">
          <OrderSummarySection order={order} />
        </div>
      </Shell>
    );
  }

  const progressIndex = PROGRESS_INDEX[order.status] ?? 0;

  return (
    <Shell>
      {!isTerminal && <OrderTrackingPoll />}
      <Eyebrow>Order #{order.orderNumber}</Eyebrow>
      <h1 className="mt-4 font-display text-[32px] leading-tight text-ink lg:text-[40px]">
        Thanks, {order.customerFirstName}.
      </h1>
      <p className="mt-3 font-body text-ink/70">
        Pickup: {formatPickupTime(order, timezone)} at {business.addressLine}.
      </p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <span className="font-label text-xs uppercase tracking-[0.15em] text-ink/50">Payment</span>
          <p className="mt-1 font-body text-lg text-ink">
            {order.paymentStatus ? PAYMENT_STATUS_LABEL[order.paymentStatus] : "Payment pending"}
          </p>
        </div>
        <div>
          <span className="font-label text-xs uppercase tracking-[0.15em] text-ink/50">Order</span>
          <p className="mt-1 font-body text-lg text-ink">{ORDER_STATUS_LABEL[order.status]}</p>
        </div>
      </div>

      <div className="mt-8">
        <OrderStatusTimeline progressIndex={progressIndex} />
      </div>

      {order.status === "READY" && (
        <div className="rounded-control border border-green/30 bg-green/5 px-5 py-4">
          <p className="font-body text-ink">
            Please pick up your order at {business.name} during your scheduled pickup time.
          </p>
        </div>
      )}

      <div className="mt-2 rounded-image border border-ink/10 bg-peach/40 p-6">
        <OrderSummarySection order={order} />
      </div>

      <PillButton href="/menu" className="mt-8">
        Back to the menu
      </PillButton>
    </Shell>
  );
}

function OrderSummarySection({ order }: { order: CustomerOrderView }) {
  return (
    <>
      <ul className="flex flex-col gap-3">
        {order.items.map((item, index) => (
          <li key={index} className="flex items-start justify-between gap-4 font-body text-ink">
            <div>
              <p>
                {item.quantity} &times; {item.itemName}
              </p>
              {item.modifiers.map((modifier, modifierIndex) => (
                <p key={modifierIndex} className="text-sm text-ink/60">
                  {modifier.groupName} &mdash; {modifier.name}
                </p>
              ))}
              {item.specialInstructions && <p className="text-sm italic text-ink/60">Note: {item.specialInstructions}</p>}
            </div>
            <span className="shrink-0">{formatPrice(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-ink/10 pt-4">
        <div className="flex items-baseline justify-between font-body text-ink">
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="mt-1 flex items-baseline justify-between font-body text-sm text-ink">
            <span>Discount{order.promotionCode ? ` (${order.promotionCode})` : ""}</span>
            <span>-{formatPrice(order.discountAmount)}</span>
          </div>
        )}
        <div className="mt-1 flex items-baseline justify-between font-body text-sm text-ink/60">
          <span>Tax</span>
          <span>{formatPrice(order.taxAmount)}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between font-body text-lg text-ink">
          <span>Final total</span>
          <span>{formatPrice(order.totalAmount)}</span>
        </div>
      </div>
      {order.specialInstructions && (
        <p className="mt-4 border-t border-ink/10 pt-4 font-body text-sm text-ink/60">Note: {order.specialInstructions}</p>
      )}
    </>
  );
}
