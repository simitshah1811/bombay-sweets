import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { transitionOrder } from "@/lib/orders/orderLifecycle";
import { getAuthenticatedSession } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";

// PENDING_PAYMENT and PAID are deliberately excluded: PENDING_PAYMENT is
// never a valid target, and PAID may only ever be set by the future
// verified Stripe webhook (Phase 8) -- never through this route, at the
// schema-validation level as well as inside the lifecycle engine itself.
const targetStatusSchema = z.enum(["ACCEPTED", "PREPARING", "READY", "COMPLETED", "CANCELLED", "REJECTED"]);

const requestSchema = z.object({
  targetStatus: targetStatusSchema,
  reason: z.string().trim().max(500).nullable().optional(),
});

/**
 * Order-status transition endpoint. This is the ONLY server-side mechanism
 * that may change an order's status -- the browser never writes to
 * Order.status directly.
 *
 * Phase 7 security: requires a valid authenticated admin session with the
 * "orders:manage" permission. The actor recorded in history is always
 * derived from that session -- a request body can never supply or override
 * who performed the action, so a caller cannot claim to be ADMIN, STAFF,
 * SYSTEM, STRIPE, WEBHOOK, or another staff member. An unauthenticated
 * visitor or a customer session (which has no admin role) is rejected
 * before the lifecycle engine is ever consulted.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/orders/[orderId]/status">) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Please sign in." }, { status: 401 });
  }
  if (!can(session.role, "orders:manage")) {
    return NextResponse.json({ ok: false, message: "You don't have permission to do that." }, { status: 403 });
  }

  const { orderId } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "We couldn't read that request. Please try again." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Please provide a valid target status." }, { status: 400 });
  }

  try {
    const result = await transitionOrder({
      orderId,
      targetStatus: parsed.data.targetStatus,
      // The coarse OrderActor enum only distinguishes "a human staff/admin
      // action" from SYSTEM/STRIPE/WEBHOOK/CUSTOMER -- the precise role and
      // identity are captured below via actorRole/adminUserId instead of
      // trying to fit OWNER/MANAGER/STAFF into that enum.
      actor: "STAFF",
      adminUserId: session.userId,
      actorRole: session.role,
      reason: parsed.data.reason ?? null,
    });

    if (result.ok) {
      return NextResponse.json({ ok: true, alreadyInTargetState: result.alreadyInTargetState, order: result.order });
    }

    switch (result.code) {
      case "ORDER_NOT_FOUND":
        return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
      case "INVALID_TRANSITION":
      case "ACTOR_NOT_ALLOWED":
      case "REASON_REQUIRED":
        return NextResponse.json({ ok: false, message: result.message }, { status: 422 });
      case "CONFLICT":
        return NextResponse.json({ ok: false, message: result.message }, { status: 409 });
      default:
        return NextResponse.json({ ok: false, message: result.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Unhandled error transitioning order:", error);
    return NextResponse.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
