import type { NotificationOrderInfo, NotificationRestaurantInfo } from "../types";

// Same palette as app/globals.css, hand-copied rather than imported --
// email HTML can't reach into the Tailwind/CSS-variable pipeline, and
// every value here is inlined per-element anyway (email clients strip
// <style> blocks and CSS custom properties unreliably).
const COLOR = {
  cream: "#fbf3e6",
  ink: "#3b2a1d",
  peach: "#f3e2c9",
  saffron: "#e38a1d",
  maroon: "#8a2332",
  green: "#6e7a4c",
} as const;

// Web-safe serif fallbacks -- email clients strip custom @font-face/Google
// Fonts imports unreliably, so this is the honest, durable choice rather
// than a font that silently fails to load for a chunk of recipients.
const SERIF = "Georgia, 'Times New Roman', serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export function formatPickupTime(
  pickupType: "ASAP" | "SCHEDULED",
  requestedPickupTime: string | null,
  timezone: string
): string {
  if (pickupType === "ASAP" || !requestedPickupTime) return "As soon as possible";
  return new Date(requestedPickupTime).toLocaleString("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/** Table-based layout, fully inline-styled -- the only markup pattern that renders consistently across email clients. */
export function renderEmailLayout(opts: {
  restaurant: NotificationRestaurantInfo;
  preheader: string;
  heading: string;
  bodyHtml: string;
}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(opts.restaurant.name)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLOR.peach};font-family:${SERIF};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.peach};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${COLOR.cream};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:${COLOR.ink};padding:24px 32px;">
                <span style="font-family:${SERIF};font-size:20px;font-weight:bold;color:${COLOR.cream};letter-spacing:0.02em;">
                  ${escapeHtml(opts.restaurant.name)}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-family:${SERIF};font-size:24px;line-height:1.3;color:${COLOR.ink};">
                  ${escapeHtml(opts.heading)}
                </h1>
                ${opts.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;background-color:${COLOR.peach};border-top:1px solid rgba(59,42,29,0.12);">
                <p style="margin:0;font-family:${SERIF};font-size:13px;color:${COLOR.ink};opacity:0.7;">
                  ${escapeHtml(opts.restaurant.name)} &middot; ${escapeHtml(opts.restaurant.addressLine)}<br />
                  <a href="${escapeHtml(opts.restaurant.phoneHref)}" style="color:${COLOR.ink};">${escapeHtml(opts.restaurant.phone)}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:${COLOR.saffron};border-radius:9999px;">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 28px;font-family:${SERIF};font-size:15px;font-weight:bold;color:${COLOR.cream};text-decoration:none;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

/** Reused by every template that shows the order's contents -- always the stored snapshot, never re-derived from the live menu. */
export function renderOrderSummary(order: NotificationOrderInfo): string {
  const itemRows = order.items
    .map((item) => {
      const modifierLines = item.modifiers
        .map((m) => `<div style="font-size:13px;color:${COLOR.ink};opacity:0.6;">${escapeHtml(m.groupName)}: ${escapeHtml(m.name)}</div>`)
        .join("");
      const noteLine = item.specialInstructions
        ? `<div style="font-size:13px;font-style:italic;color:${COLOR.ink};opacity:0.6;">Note: ${escapeHtml(item.specialInstructions)}</div>`
        : "";
      return `<tr>
        <td style="padding:6px 0;font-size:15px;color:${COLOR.ink};vertical-align:top;">
          ${item.quantity} &times; ${escapeHtml(item.itemName)}
          ${modifierLines}
          ${noteLine}
        </td>
        <td style="padding:6px 0;font-size:15px;color:${COLOR.ink};text-align:right;white-space:nowrap;vertical-align:top;">${formatCurrency(item.lineTotal)}</td>
      </tr>`;
    })
    .join("");

  const discountRow =
    order.discountAmount > 0
      ? `<tr>
          <td style="padding:2px 0;font-size:14px;color:${COLOR.ink};">Discount${order.promotionCode ? ` (${escapeHtml(order.promotionCode)})` : ""}</td>
          <td style="padding:2px 0;font-size:14px;color:${COLOR.ink};text-align:right;">-${formatCurrency(order.discountAmount)}</td>
        </tr>`
      : "";

  const orderNoteHtml = order.specialInstructions
    ? `<p style="margin:12px 0 0;font-size:13px;font-style:italic;color:${COLOR.ink};opacity:0.7;">Order note: ${escapeHtml(order.specialInstructions)}</p>`
    : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
    ${itemRows}
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid rgba(59,42,29,0.12);padding-top:8px;">
    <tr>
      <td style="padding:2px 0;font-size:14px;color:${COLOR.ink};">Subtotal</td>
      <td style="padding:2px 0;font-size:14px;color:${COLOR.ink};text-align:right;">${formatCurrency(order.subtotal)}</td>
    </tr>
    ${discountRow}
    <tr>
      <td style="padding:2px 0;font-size:14px;color:${COLOR.ink};">Tax</td>
      <td style="padding:2px 0;font-size:14px;color:${COLOR.ink};text-align:right;">${formatCurrency(order.taxAmount)}</td>
    </tr>
    <tr>
      <td style="padding:6px 0 0;font-size:17px;font-weight:bold;color:${COLOR.ink};">Total</td>
      <td style="padding:6px 0 0;font-size:17px;font-weight:bold;color:${COLOR.ink};text-align:right;">${formatCurrency(order.totalAmount)}</td>
    </tr>
  </table>
  ${orderNoteHtml}`;
}

export function renderPlainTextOrderSummary(order: NotificationOrderInfo): string {
  const lines: string[] = [];
  for (const item of order.items) {
    lines.push(`${item.quantity} x ${item.itemName} - ${formatCurrency(item.lineTotal)}`);
    for (const m of item.modifiers) lines.push(`  ${m.groupName}: ${m.name}`);
    if (item.specialInstructions) lines.push(`  Note: ${item.specialInstructions}`);
  }
  lines.push("");
  lines.push(`Subtotal: ${formatCurrency(order.subtotal)}`);
  if (order.discountAmount > 0) {
    lines.push(`Discount${order.promotionCode ? ` (${order.promotionCode})` : ""}: -${formatCurrency(order.discountAmount)}`);
  }
  lines.push(`Tax: ${formatCurrency(order.taxAmount)}`);
  lines.push(`Total: ${formatCurrency(order.totalAmount)}`);
  if (order.specialInstructions) lines.push(`\nOrder note: ${order.specialInstructions}`);
  return lines.join("\n");
}

export { COLOR };
