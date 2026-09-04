import type { EmailTemplate } from "../types";
import { renderEmailLayout, renderButton, formatPickupTime, escapeHtml } from "./shared";

export const orderAcceptedTemplate: EmailTemplate = (order, restaurant) => {
  const pickup = formatPickupTime(order.pickupType, order.requestedPickupTime, restaurant.timezone);
  const heading = "Your order has been accepted";

  // Deliberately does not claim preparation has started -- that's its own
  // separate, later notification, triggered only by the real ACCEPTED ->
  // PREPARING transition.
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
      ${escapeHtml(restaurant.name)} has accepted order <strong>#${escapeHtml(order.orderNumber)}</strong> and will begin preparing it soon.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
      Pickup: <strong>${escapeHtml(pickup)}</strong> at ${escapeHtml(restaurant.addressLine)}.
    </p>
    ${renderButton("Track your order", order.trackingUrl)}
  `;

  const text = `Your order has been accepted

${restaurant.name} has accepted order #${order.orderNumber} and will begin preparing it soon.

Pickup: ${pickup} at ${restaurant.addressLine}.

Track your order: ${order.trackingUrl}`;

  return {
    subject: `Order #${order.orderNumber} accepted -- ${restaurant.name}`,
    html: renderEmailLayout({ restaurant, preheader: `Order #${order.orderNumber} accepted`, heading, bodyHtml }),
    text,
  };
};
