import "server-only";
import type { AdminRole } from "@/lib/generated/prisma/client";

/**
 * The single authoritative definition of what each admin role can do.
 * Every page, Server Action, and API route checks permissions through
 * `can()` -- nothing re-implements this matrix elsewhere.
 */
export type Permission =
  | "orders:view"
  | "orders:manage" // accept / reject / prepare / ready / complete / cancel
  | "menu:manage" // categories, items, modifiers, availability
  | "settings:manage" // business hours, pickup config, tax display
  | "staff:manage" // create/manage other admin accounts
  | "security:manage"; // anything security/ownership-sensitive

const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  OWNER: ["orders:view", "orders:manage", "menu:manage", "settings:manage", "staff:manage", "security:manage"],
  MANAGER: ["orders:view", "orders:manage", "menu:manage", "settings:manage"],
  STAFF: ["orders:view", "orders:manage"],
};

export function can(role: AdminRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsForRole(role: AdminRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
