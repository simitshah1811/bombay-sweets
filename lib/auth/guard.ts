import "server-only";
import { redirect } from "next/navigation";
import { getSession, isSessionAuthenticated, type SessionData } from "@/lib/auth/session";
import { can, type Permission } from "@/lib/auth/permissions";

export type AuthenticatedSession = Required<SessionData>;

/**
 * For Server Components (pages/layouts). Redirects to login if there's no
 * valid session. `proxy.ts` already redirects unauthenticated visitors
 * before a page like this even renders -- this is the defense-in-depth
 * backstop in case that's ever misconfigured or bypassed, not the only line
 * of defense.
 */
export async function requireAdminSession(): Promise<AuthenticatedSession> {
  const session = await getSession();
  if (!isSessionAuthenticated(session)) {
    redirect("/admin/login");
  }
  return session;
}

/** Same as requireAdminSession, but also enforces a specific permission. */
export async function requirePermission(permission: Permission): Promise<AuthenticatedSession> {
  const session = await requireAdminSession();
  if (!can(session.role, permission)) {
    redirect("/admin?error=forbidden");
  }
  return session;
}

/**
 * For Route Handlers and Server Actions, which need to return a JSON error
 * or a validation result rather than redirect. Never trust a client-
 * supplied identity/role -- this is the only source of truth for "who is
 * calling this."
 */
export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const session = await getSession();
  return isSessionAuthenticated(session) ? session : null;
}
