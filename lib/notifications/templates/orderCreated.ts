import type { EmailTemplate } from "../types";
import { renderEmailLayout, renderButton, renderOrderSummary, renderPlainTextOrderSummary, formatPickupTime, escapeHtml } from "./shared";

export const orderCreatedTemplate: EmailTemplate = (order, restaurant) => {
  const pickup = formatPickupTime(order.pickupType, order.requestedPickupTime, restaurant.timezone);
  const heading = `Thanks, ${order.customerFirstName}!`;

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
      We&rsquo;ve received your order <strong>#${escapeHtml(order.orderNumber)}</strong>. Pickup: <strong>${escapeHtml(pickup)}</strong> at ${escapeHtml(restaurant.addressLine)}.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
      Payment hasn&rsquo;t been completed yet -- we&rsquo;ll let you know as soon as it&rsquo;s confirmed.
    </p>
    ${renderOrderSummary(order)}
    ${renderButton("Track your order", order.trackingUrl)}
  `;

  const text = `Thanks, ${order.customerFirstName}!

We've received your order #${order.orderNumber}. Pickup: ${pickup} at ${restaurant.addressLine}.

Payment hasn't been completed yet -- we'll let you know as soon as it's confirmed.

${renderPlainTextOrderSummary(order)}

Track your order: ${order.trackingUrl}`;

  return {
    subject: `Order #${order.orderNumber} received -- ${restaurant.name}`,
    html: renderEmailLayout({ restaurant, preheader: `Order #${order.orderNumber} received`, heading, bodyHtml }),
    text,
  };
};
