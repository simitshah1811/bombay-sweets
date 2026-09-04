import type { EmailTemplate } from "../types";
import { renderEmailLayout, escapeHtml } from "./shared";

export const orderCancelledTemplate: EmailTemplate = (order, restaurant) => {
  const heading = "Order cancelled";

  // Never claims a refund happened -- this system has no refund flow yet,
  // so a paid-then-cancelled order gets a "please call us" prompt instead
  // of an invented "refunded" claim. Never includes the raw admin
  // note/reason (could contain internal-only shorthand); a fixed, safe
  // message is used instead, matching the Phase 9 tracking page.
  const paidNote =
    order.paymentStatus === "SUCCEEDED"
      ? `<p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
          If you were charged for this order, please call us at <a href="${escapeHtml(restaurant.phoneHref)}" style="color:#3b2a1d;">${escapeHtml(restaurant.phone)}</a> and we&rsquo;ll take care of it.
        </p>`
      : "";

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
      Hi ${escapeHtml(order.customerFirstName)}, order <strong>#${escapeHtml(order.orderNumber)}</strong> has been cancelled and will not be prepared.
    </p>
    ${paidNote}
    <p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
      Questions? Call ${escapeHtml(restaurant.name)} at <a href="${escapeHtml(restaurant.phoneHref)}" style="color:#3b2a1d;">${escapeHtml(restaurant.phone)}</a>.
    </p>
  `;

  const text = `Order cancelled

Hi ${order.customerFirstName}, order #${order.orderNumber} has been cancelled and will not be prepared.
${order.paymentStatus === "SUCCEEDED" ? `\nIf you were charged for this order, please call us at ${restaurant.phone} and we'll take care of it.\n` : ""}
Questions? Call ${restaurant.name} at ${restaurant.phone}.`;

  return {
    subject: `Order #${order.orderNumber} cancelled -- ${restaurant.name}`,
    html: renderEmailLayout({ restaurant, preheader: `Order #${order.orderNumber} has been cancelled`, heading, bodyHtml }),
    text,
  };
};
