import { NextResponse, type NextRequest } from "next/server";
import { getSessionForProxy, isSessionAuthenticated } from "@/lib/auth/session";

/**
 * Fast, first-line defense for the whole /admin area: an unauthenticated
 * visitor is redirected to the login page before any admin page ever
 * renders or fetches data. This is not the only check -- every admin page
 * and API route independently re-verifies the session too (see
 * lib/auth/guard.ts) -- but it means logged-out visitors never even see a
 * flash of dashboard UI.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const response = NextResponse.next();
    const session = await getSessionForProxy(request, response);
    if (!isSessionAuthenticated(session)) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
