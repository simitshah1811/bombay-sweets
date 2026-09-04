import type { EmailTemplate } from "../types";
import { renderEmailLayout, escapeHtml } from "./shared";

export const orderRejectedTemplate: EmailTemplate = (order, restaurant) => {
  const heading = "We're unable to accept this order";

  // A REJECTED order is always one the restaurant declined before ever
  // accepting it -- payment is never left charged in that state under this
  // system's rules, so no "if you were charged" branch is needed here
  // (unlike the cancellation template, which can happen after payment).
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
      Hi ${escapeHtml(order.customerFirstName)}, unfortunately ${escapeHtml(restaurant.name)} isn&rsquo;t able to accept order <strong>#${escapeHtml(order.orderNumber)}</strong> right now.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#3b2a1d;">
      We&rsquo;re sorry for the inconvenience. Please call us at <a href="${escapeHtml(restaurant.phoneHref)}" style="color:#3b2a1d;">${escapeHtml(restaurant.phone)}</a> if you have any questions.
    </p>
  `;

  const text = `We're unable to accept this order

Hi ${order.customerFirstName}, unfortunately ${restaurant.name} isn't able to accept order #${order.orderNumber} right now.

We're sorry for the inconvenience. Please call us at ${restaurant.phone} if you have any questions.`;

  return {
    subject: `Order #${order.orderNumber} could not be accepted -- ${restaurant.name}`,
    html: renderEmailLayout({ restaurant, preheader: `Order #${order.orderNumber} could not be accepted`, heading, bodyHtml }),
    text,
  };
};
