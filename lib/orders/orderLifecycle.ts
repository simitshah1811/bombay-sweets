import "server-only";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import type { OrderStatus, OrderActor } from "@/lib/generated/prisma/client";
import { notifyOrderEvent } from "@/lib/notifications/service";
import { STATUS_TO_NOTIFICATION_EVENT } from "@/lib/notifications/eventMapping";

/**
 * BOMBAY SWEETS — ORDER LIFECYCLE ENGINE (Phase 6)
 *
 * The single authoritative source for which order-status transitions are
 * allowed, who may perform them, and what happens when one succeeds. No
 * other file -- API route, future admin page, or webhook handler -- should
 * contain its own copy of these rules. Everything calls transitionOrder().
 *
 * STATE DIAGRAM
 *
 *   PENDING_PAYMENT --(Stripe/webhook only)--> PAID
 *   PENDING_PAYMENT --(cancel)--> CANCELLED
 *
 *   PAID --(staff accepts)--> ACCEPTED
 *   PAID --(staff declines)--> REJECTED
 *   PAID --(cancel)--> CANCELLED
 *
 *   ACCEPTED --(staff starts cooking)--> PREPARING
 *   ACCEPTED --(cancel)--> CANCELLED
 *
 *   PREPARING --(staff marks ready)--> READY
 *   PREPARING --(cancel)--> CANCELLED
 *
 *   READY --(staff completes)--> COMPLETED   [terminal]
 *   READY --(cancel, e.g. no-show)--> CANCELLED
 *
 *   REJECTED, CANCELLED, REFUNDED are all terminal -- nothing transitions
 *   out of them in this phase. REFUNDED has no valid *incoming* transition
 *   yet either; it exists only as scaffolding for Phase 8's refund flow.
 *
 * WHY REJECTED ONLY APPLIES TO PAID: rejection is the restaurant's initial
 * response to a newly-paid order it hasn't accepted yet ("we can't take
 * this"). Once ACCEPTED, backing out is a CANCELLED, not a REJECTED -- the
 * order was already committed to, so "rejected" would misdescribe what
 * happened. This keeps the two terms meaningfully distinct instead of
 * synonyms.
 *
 * WHY PENDING_PAYMENT CAN'T BE REJECTED: staff never see or act on an order
 * before it's paid, so there's nothing for them to decline yet. CANCELLED
 * covers "this will not proceed" for an order still awaiting payment
 * (abandoned checkout, customer changed their mind, etc.).
 */

const TERMINAL_STATUSES: readonly OrderStatus[] = ["COMPLETED", "CANCELLED", "REJECTED", "REFUNDED"];

interface TransitionRule {
  allowedActors: readonly OrderActor[];
  reasonRequired: boolean;
}

// Partial<Record<...>> per current status: only the keys present are valid
// next statuses. An absent key means "no such transition exists," full stop.
const TRANSITION_RULES: Record<OrderStatus, Partial<Record<OrderStatus, TransitionRule>>> = {
  PENDING_PAYMENT: {
    // Reserved for the future verified Stripe webhook (Phase 8). No caller
    // in this codebase currently has permission to use this actor pair.
    PAID: { allowedActors: ["STRIPE", "WEBHOOK"], reasonRequired: false },
    CANCELLED: { allowedActors: ["CUSTOMER", "ADMIN", "STAFF", "SYSTEM"], reasonRequired: false },
  },
  PAID: {
    ACCEPTED: { allowedActors: ["ADMIN", "STAFF"], reasonRequired: false },
    REJECTED: { allowedActors: ["ADMIN", "STAFF"], reasonRequired: true },
    CANCELLED: { allowedActors: ["CUSTOMER", "ADMIN", "STAFF", "SYSTEM"], reasonRequired: true },
  },
  ACCEPTED: {
    PREPARING: { allowedActors: ["ADMIN", "STAFF"], reasonRequired: false },
    CANCELLED: { allowedActors: ["ADMIN", "STAFF", "SYSTEM"], reasonRequired: true },
  },
  PREPARING: {
    READY: { allowedActors: ["ADMIN", "STAFF"], reasonRequired: false },
    CANCELLED: { allowedActors: ["ADMIN", "STAFF", "SYSTEM"], reasonRequired: true },
  },
  READY: {
    COMPLETED: { allowedActors: ["ADMIN", "STAFF"], reasonRequired: false },
    CANCELLED: { allowedActors: ["ADMIN", "STAFF", "SYSTEM"], reasonRequired: true },
  },
  COMPLETED: {},
  CANCELLED: {},
  REJECTED: {},
  REFUNDED: {},
};

export function isTerminalStatus(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** What a caller (e.g. the admin UI) may offer as next actions for an order in this status. */
export function getAllowedNextStatuses(status: OrderStatus): OrderStatus[] {
  return Object.keys(TRANSITION_RULES[status] ?? {}) as OrderStatus[];
}

/**
 * Same as getAllowedNextStatuses, but filtered to transitions a specific
 * actor may actually perform. This is what the admin UI must use to render
 * action buttons -- PENDING_PAYMENT -> PAID exists as a rule (for the future
 * Stripe webhook), but a STAFF actor is never in its allowedActors list, so
 * a button offering it would always fail server-side. Filtering here means
 * staff can never even see, let alone click, an action they aren't
 * permitted to take -- e.g. they can cancel an unpaid order but can never
 * mark one paid themselves.
 */
export function getAllowedNextStatusesForActor(status: OrderStatus, actor: OrderActor): OrderStatus[] {
  const rules = TRANSITION_RULES[status] ?? {};
  return (Object.keys(rules) as OrderStatus[]).filter((target) => rules[target]!.allowedActors.includes(actor));
}

/**
 * Whether a specific transition requires a reason. The admin UI calls this
 * to decide whether to show a reason modal before submitting -- it must
 * never guess or hardcode "REJECTED and CANCELLED always need a reason"
 * itself, since that would duplicate a rule this engine already owns.
 */
export function isReasonRequired(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  return TRANSITION_RULES[currentStatus]?.[targetStatus]?.reasonRequired ?? false;
}

export interface OrderLifecycleSnapshot {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  updatedAt: string;
}

export type TransitionOrderResult =
  | { ok: true; alreadyInTargetState: boolean; order: OrderLifecycleSnapshot }
  | { ok: false; code: "ORDER_NOT_FOUND" }
  | { ok: false; code: "INVALID_TRANSITION"; message: string }
  | { ok: false; code: "ACTOR_NOT_ALLOWED"; message: string }
  | { ok: false; code: "REASON_REQUIRED"; message: string }
  | { ok: false; code: "CONFLICT"; message: string }
  | { ok: false; code: "SERVER_ERROR"; message: string };

export interface TransitionOrderInput {
  orderId: string;
  targetStatus: OrderStatus;
  actor: OrderActor;
  reason?: string | null;
  /** The authenticated staff member who performed this, when actor is a human (ADMIN/STAFF). */
  adminUserId?: string | null;
  /** Snapshot of their role at the time (e.g. "OWNER"), independent of the coarse OrderActor enum. */
  actorRole?: string | null;
}

function toSnapshot(order: { id: string; orderNumber: string; status: OrderStatus; updatedAt: Date }): OrderLifecycleSnapshot {
  return { id: order.id, orderNumber: order.orderNumber, status: order.status, updatedAt: order.updatedAt.toISOString() };
}

/**
 * The only function anywhere in this codebase that may change Order.status.
 * Never trusts a caller's idea of the order's current state -- always reads
 * it fresh from PostgreSQL, validates the transition against the rules
 * above, and only then writes, atomically, alongside its history record.
 *
 * Concurrency: the actual state change is a conditional UPDATE ("set status
 * to X WHERE id = ? AND status is still what we just read"), so if two
 * requests race, only the one that reaches Postgres first can possibly
 * match that WHERE clause -- the second necessarily updates zero rows.
 * That is not treated as a hard failure: this function re-reads the order
 * afterward, and if it finds the target status already applied (meaning
 * someone else made the exact same change a moment earlier, or this exact
 * request was retried after already succeeding), it reports success
 * without creating a second history row. Only a genuine mismatch -- the
 * order ended up somewhere else entirely -- is reported as a real CONFLICT.
 * This single check covers both concurrent-request safety and idempotency
 * without needing a separate idempotency-key table.
 */
export async function transitionOrder(input: TransitionOrderInput): Promise<TransitionOrderResult> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { id: true, orderNumber: true, status: true, updatedAt: true },
  });
  if (!order) return { ok: false, code: "ORDER_NOT_FOUND" };

  const currentStatus = order.status;

  // Idempotent no-op: the order is already exactly where the caller wants it.
  if (currentStatus === input.targetStatus) {
    return { ok: true, alreadyInTargetState: true, order: toSnapshot(order) };
  }

  const rule = TRANSITION_RULES[currentStatus]?.[input.targetStatus];
  if (!rule) {
    return {
      ok: false,
      code: "INVALID_TRANSITION",
      message: `An order cannot move from ${currentStatus} to ${input.targetStatus}.`,
    };
  }
  if (!rule.allowedActors.includes(input.actor)) {
    return { ok: false, code: "ACTOR_NOT_ALLOWED", message: "This action isn't permitted for this transition." };
  }
  if (rule.reasonRequired && !input.reason?.trim()) {
    return { ok: false, code: "REASON_REQUIRED", message: "A reason is required for this action." };
  }

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.order.updateMany({
        where: { id: input.orderId, status: currentStatus },
        data: { status: input.targetStatus },
      });

      if (updateResult.count === 0) {
        // Lost the race -- someone else changed this order between our read
        // and our write. Nothing to roll back; we just never wrote.
        return { raced: true as const };
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: input.orderId,
          previousStatus: currentStatus,
          status: input.targetStatus,
          actor: input.actor,
          note: input.reason?.trim() || null,
          adminUserId: input.adminUserId ?? null,
          actorRole: input.actorRole ?? null,
        },
      });

      const updated = await tx.order.findUniqueOrThrow({
        where: { id: input.orderId },
        select: { id: true, orderNumber: true, status: true, updatedAt: true },
      });
      return { raced: false as const, order: updated };
    });

    if (outcome.raced) {
      const latest = await prisma.order.findUnique({
        where: { id: input.orderId },
        select: { id: true, orderNumber: true, status: true, updatedAt: true },
      });
      if (latest && latest.status === input.targetStatus) {
        // Someone else completed the identical transition first -- treat as success, not an error.
        return { ok: true, alreadyInTargetState: true, order: toSnapshot(latest) };
      }
      return {
        ok: false,
        code: "CONFLICT",
        message: "This order was just updated by someone else. Please refresh and try again.",
      };
    }

    // Notification dispatch happens here, and ONLY here for every
    // lifecycle-driven event -- after the transaction above has actually
    // committed (never before), and only for a genuinely fresh
    // transition, not an idempotent no-op. Scheduled via after() so a
    // slow or temporarily-unavailable email provider can never delay or
    // fail the caller's response (the admin action, the webhook, the
    // cron sweep) -- see lib/notifications/service.ts for the delivery
    // and retry logic itself.
    const notificationEvent = STATUS_TO_NOTIFICATION_EVENT[input.targetStatus];
    if (notificationEvent) {
      const orderId = input.orderId;
      after(() => notifyOrderEvent(orderId, notificationEvent));
    }

    return { ok: true, alreadyInTargetState: false, order: toSnapshot(outcome.order) };
  } catch (error) {
    console.error("Order transition failed:", error);
    return { ok: false, code: "SERVER_ERROR", message: "We couldn't update this order. Please try again." };
  }
}
