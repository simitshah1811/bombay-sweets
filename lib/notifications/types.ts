import type { NotificationEventType, PaymentStatus } from "@/lib/generated/prisma/client";

export type { NotificationEventType };

/**
 * Restaurant identity a template needs -- deliberately its own small shape,
 * not the full Restaurant row, and never a hardcoded "Bombay Sweets"
 * literal anywhere in the templates. This is what keeps the notification
 * engine honest about being restaurant-agnostic (Phase 10 requirement #7)
 * without actually building multi-restaurant support.
 */
export interface NotificationRestaurantInfo {
  name: string;
  phone: string;
  phoneHref: string;
  addressLine: string;
  email: string;
  timezone: string;
}

export interface NotificationOrderItem {
  itemName: string;
  quantity: number;
  lineTotal: number;
  modifiers: { groupName: string; name: string }[];
  specialInstructions: string | null;
}

/**
 * Everything a template needs about the order -- built entirely from the
 * order's own stored snapshot (never the live menu/promotion config), per
 * requirement #28/#29. Cancellation/rejection reasons are deliberately NOT
 * included here: OrderStatusHistory.note can contain internal staff
 * shorthand never meant for a customer, so templates use a fixed, safe,
 * generic message instead (same choice already made for the Phase 9
 * tracking page).
 */
export interface NotificationOrderInfo {
  orderNumber: string;
  customerFirstName: string;
  customerEmail: string;
  pickupType: "ASAP" | "SCHEDULED";
  requestedPickupTime: string | null; // ISO
  specialInstructions: string | null;
  items: NotificationOrderItem[];
  subtotal: number;
  discountAmount: number;
  promotionCode: string | null;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus | null;
  /** Full, absolute URL -- already includes the Phase 9 tracking token. */
  trackingUrl: string;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export type EmailTemplate = (order: NotificationOrderInfo, restaurant: NotificationRestaurantInfo) => EmailContent;
