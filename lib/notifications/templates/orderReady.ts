import type { EmailTemplate } from "../types";
import { renderEmailLayout, renderButton, formatPickupTime, escapeHtml } from "./shared";

export const orderReadyTemplate: EmailTemplate = (order, restaurant) => {
  const pickup = formatPickupTime(order.pickupType, order.requestedPickupTime, restaurant.timezone);
  const heading = "Ready for pickup!";

  // The most prominent notification -- a distinct green banner treatment,
  // consistent with the "Ready for pickup" state's green accent already
  // used on the Phase 9 tracking page. Pickup location/hours come straight
  // from the database-configured restaurant record, never invented copy.
  const bodyHtml = `
    <div style="background-color:#6e7a4c;border-radius:8px;padding:16px 20px;margin-bottom:16px;">
      <p style="margin:0;font-size:16px;color:#fbf3e6;font-weight:bold;">
        Order #${escapeHtml(order.orderNumber)} is ready for pickup.
      </p>
    </div>
    <p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
      Please pick up your order at ${escapeHtml(restaurant.name)}, ${escapeHtml(restaurant.addressLine)}.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
      Pickup time: <strong>${escapeHtml(pickup)}</strong><br />
      Questions? Call us: <a href="${escapeHtml(restaurant.phoneHref)}" style="color:#3b2a1d;">${escapeHtml(restaurant.phone)}</a>
    </p>
    ${renderButton("Track your order", order.trackingUrl)}
  `;

  const text = `Ready for pickup!

Order #${order.orderNumber} is ready for pickup.

Please pick up your order at ${restaurant.name}, ${restaurant.addressLine}.

Pickup time: ${pickup}
Questions? Call us: ${restaurant.phone}

Track your order: ${order.trackingUrl}`;

  return {
    subject: `Order #${order.orderNumber} is ready for pickup -- ${restaurant.name}`,
    html: renderEmailLayout({ restaurant, preheader: `Order #${order.orderNumber} is ready for pickup`, heading, bodyHtml }),
    text,
  };
};
