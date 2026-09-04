import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import type { NextRequest, NextResponse } from "next/server";
import type { AdminRole } from "@/lib/generated/prisma/client";

export interface SessionData {
  userId?: string;
  email?: string;
  role?: AdminRole;
  firstName?: string;
  lastName?: string;
}

const secret = process.env.SESSION_SECRET;
if (!secret || secret.length < 32) {
  throw new Error(
    "SESSION_SECRET is missing or too short (needs 32+ characters). Set it in your environment before using admin auth."
  );
}

export const sessionOptions: SessionOptions = {
  cookieName: "bombay_sweets_admin_session",
  password: secret,
  ttl: 60 * 60 * 8, // 8 hours
  cookieOptions: {
    httpOnly: true,
    // Secure requires HTTPS -- true on Vercel (prod/preview), false for local `next dev` over http://.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

/** For Server Components, Route Handlers, and Server Actions (reads/writes the request's cookie jar). */
export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

/** For proxy.ts, which works with a NextRequest/NextResponse pair rather than next/headers. */
export async function getSessionForProxy(
  request: NextRequest,
  response: NextResponse
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(request, response, sessionOptions);
}

export function isSessionAuthenticated(session: SessionData): session is Required<SessionData> {
  return Boolean(session.userId && session.role);
}
