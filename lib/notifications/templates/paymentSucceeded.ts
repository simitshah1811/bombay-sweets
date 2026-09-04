import type { EmailTemplate } from "../types";
import { renderEmailLayout, renderButton, renderOrderSummary, renderPlainTextOrderSummary, formatPickupTime, escapeHtml } from "./shared";

export const paymentSucceededTemplate: EmailTemplate = (order, restaurant) => {
  const pickup = formatPickupTime(order.pickupType, order.requestedPickupTime, restaurant.timezone);
  const heading = "Payment received";

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
      Your payment for order <strong>#${escapeHtml(order.orderNumber)}</strong> has been confirmed. ${escapeHtml(restaurant.name)} has been notified and will review your order shortly.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
      Pickup: <strong>${escapeHtml(pickup)}</strong> at ${escapeHtml(restaurant.addressLine)}.
    </p>
    ${renderOrderSummary(order)}
    ${renderButton("Track your order", order.trackingUrl)}
  `;

  const text = `Payment received

Your payment for order #${order.orderNumber} has been confirmed. ${restaurant.name} has been notified and will review your order shortly.

Pickup: ${pickup} at ${restaurant.addressLine}.

${renderPlainTextOrderSummary(order)}

Track your order: ${order.trackingUrl}`;

  return {
    subject: `Payment confirmed -- order #${order.orderNumber}`,
    html: renderEmailLayout({ restaurant, preheader: `Payment confirmed for order #${order.orderNumber}`, heading, bodyHtml }),
    text,
  };
};
