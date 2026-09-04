import "server-only";
import { prisma } from "@/lib/db";

/**
 * Lightweight audit log for admin actions that aren't order-status
 * transitions (those already go through OrderStatusHistory -- see
 * lib/orders/orderLifecycle.ts -- and are never duplicated here). Never
 * pass a password, session token, or other secret in `note`.
 */
export async function logAdminActivity(input: {
  adminUserId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  note?: string;
}): Promise<void> {
  try {
    await prisma.adminActivityLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        note: input.note ?? null,
      },
    });
  } catch (error) {
    // Never let audit-logging failures block the actual admin action.
    console.error("Failed to write admin activity log:", error);
  }
}
