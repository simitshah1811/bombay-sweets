import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma, OrderStatus, PaymentStatus } from "@/lib/generated/prisma/client";
import { getAllowedNextStatusesForActor, isReasonRequired } from "@/lib/orders/orderLifecycle";

const ORDER_INCLUDE = { items: { include: { modifiers: true } }, payment: true } as const;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

export interface AdminOrderAction {
  targetStatus: OrderStatus;
  reasonRequired: boolean;
}

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupType: "ASAP" | "SCHEDULED";
  requestedPickupTime: string | null;
  specialInstructions: string | null;
  createdAt: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  promotionCode: string | null;
  isPaid: boolean;
  /** Detailed payment state from the Payment record, distinct from order/fulfillment status. Null if no Payment row exists yet (e.g. checkout never started). */
  paymentStatus: PaymentStatus | null;
  items: {
    itemName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    specialInstructions: string | null;
    modifiers: { groupName: string; name: string; priceAdjustment: number }[];
  }[];
  actions: AdminOrderAction[];
}

// This is the only place an admin order gets shaped for display -- every
// field the UI can show comes from here, so a card can never accidentally
// render something (e.g. a future payment-card field) that wasn't
// deliberately included in this mapping.
function toAdminSummary(order: OrderWithItems): AdminOrderSummary {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: `${order.customerFirstName} ${order.customerLastName}`,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    pickupType: order.pickupType,
    requestedPickupTime: order.requestedPickupTime?.toISOString() ?? null,
    specialInstructions: order.specialInstructions,
    createdAt: order.createdAt.toISOString(),
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    taxAmount: Number(order.taxAmount),
    totalAmount: Number(order.totalAmount),
    promotionCode: order.promotionCode,
    // A CANCELLED or REJECTED order can be reached either from
    // PENDING_PAYMENT (never paid) or from PAID (paid, then cancelled) --
    // status alone can't tell those apart, so it's never used as the
    // signal for a terminal-without-payment-record order. Only PAID (and
    // everything after it in fulfillment) is treated as "paid" when there's
    // no real Payment row -- true for demo orders seeded before Stripe
    // existed. Once a Payment row exists (every order created through the
    // real Phase 8 flow), paymentStatus below is authoritative and this
    // fallback is never consulted.
    isPaid: !["PENDING_PAYMENT", "CANCELLED", "REJECTED"].includes(order.status),
    paymentStatus: order.payment?.status ?? null,
    items: order.items.map((item) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
      specialInstructions: item.specialInstructions,
      modifiers: item.modifiers.map((m) => ({
        groupName: m.modifierGroupName,
        name: m.modifierName,
        priceAdjustment: Number(m.priceAdjustment),
      })),
    })),
    // "STAFF" matches the actor the status route always submits for an
    // authenticated admin session (see app/api/orders/[orderId]/status) --
    // any transition not available to that actor (e.g. PENDING_PAYMENT ->
    // PAID, reserved for the Stripe webhook) must never appear as a button.
    actions: getAllowedNextStatusesForActor(order.status, "STAFF").map((targetStatus) => ({
      targetStatus,
      reasonRequired: isReasonRequired(order.status, targetStatus),
    })),
  };
}

// The queue only ever shows work staff can actually act on. PENDING_PAYMENT
// orders are excluded on purpose -- they aren't real orders yet, so they
// must never appear as "new" or be accidentally fulfillable. Terminal
// statuses (COMPLETED/CANCELLED/REJECTED/REFUNDED) belong in history, not
// the working queue.
const QUEUE_STATUSES: OrderStatus[] = ["PAID", "ACCEPTED", "PREPARING", "READY"];

export async function getQueueOrders(): Promise<Record<string, AdminOrderSummary[]>> {
  const orders = await prisma.order.findMany({
    where: { status: { in: QUEUE_STATUSES } },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "asc" },
  });

  const grouped: Record<string, AdminOrderSummary[]> = { PAID: [], ACCEPTED: [], PREPARING: [], READY: [] };
  for (const order of orders) {
    grouped[order.status].push(toAdminSummary(order));
  }
  return grouped;
}

export interface OrderHistoryFilters {
  orderNumber?: string;
  status?: OrderStatus;
  customerQuery?: string; // matches name, phone, or email
  date?: string; // "YYYY-MM-DD", matched against createdAt in UTC calendar terms (display-only filter)
  page?: number;
}

const PAGE_SIZE = 20;

export async function getOrderHistory(
  filters: OrderHistoryFilters
): Promise<{ orders: AdminOrderSummary[]; total: number; page: number; pageCount: number }> {
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.OrderWhereInput = {};
  if (filters.orderNumber) {
    where.orderNumber = { contains: filters.orderNumber, mode: "insensitive" };
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.customerQuery) {
    const q = filters.customerQuery;
    where.OR = [
      { customerFirstName: { contains: q, mode: "insensitive" } },
      { customerLastName: { contains: q, mode: "insensitive" } },
      { customerEmail: { contains: q, mode: "insensitive" } },
      { customerPhone: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00.000Z`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    if (!Number.isNaN(start.getTime())) {
      where.createdAt = { gte: start, lt: end };
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map(toAdminSummary),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getOrderById(id: string): Promise<AdminOrderSummary | null> {
  const order = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  return order ? toAdminSummary(order) : null;
}
