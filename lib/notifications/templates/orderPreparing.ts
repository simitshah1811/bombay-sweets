import type { EmailTemplate } from "../types";
import { renderEmailLayout, renderButton, formatPickupTime, escapeHtml } from "./shared";

export const orderPreparingTemplate: EmailTemplate = (order, restaurant) => {
  const pickup = formatPickupTime(order.pickupType, order.requestedPickupTime, restaurant.timezone);
  const heading = "Your order is being prepared";

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
      ${escapeHtml(restaurant.name)} is now preparing order <strong>#${escapeHtml(order.orderNumber)}</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
      Pickup: <strong>${escapeHtml(pickup)}</strong> at ${escapeHtml(restaurant.addressLine)}.
    </p>
    ${renderButton("Track your order", order.trackingUrl)}
  `;

  const text = `Your order is being prepared

${restaurant.name} is now preparing order #${order.orderNumber}.

Pickup: ${pickup} at ${restaurant.addressLine}.

Track your order: ${order.trackingUrl}`;

  return {
    subject: `Order #${order.orderNumber} is being prepared -- ${restaurant.name}`,
    html: renderEmailLayout({ restaurant, preheader: `Order #${order.orderNumber} is being prepared`, heading, bodyHtml }),
    text,
  };
};
