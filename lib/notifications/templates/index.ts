import type { NotificationEventType, EmailTemplate } from "../types";
import { orderCreatedTemplate } from "./orderCreated";
import { paymentSucceededTemplate } from "./paymentSucceeded";
import { orderAcceptedTemplate } from "./orderAccepted";
import { orderPreparingTemplate } from "./orderPreparing";
import { orderReadyTemplate } from "./orderReady";
import { orderCancelledTemplate } from "./orderCancelled";
import { orderRejectedTemplate } from "./orderRejected";

export const EMAIL_TEMPLATES: Record<NotificationEventType, EmailTemplate> = {
  ORDER_CREATED: orderCreatedTemplate,
  PAYMENT_SUCCEEDED: paymentSucceededTemplate,
  ORDER_ACCEPTED: orderAcceptedTemplate,
  ORDER_PREPARING: orderPreparingTemplate,
  ORDER_READY: orderReadyTemplate,
  ORDER_CANCELLED: orderCancelledTemplate,
  ORDER_REJECTED: orderRejectedTemplate,
};
