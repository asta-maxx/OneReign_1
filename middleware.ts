import { NextRequest, NextResponse } from "next/server";

/**
 * Auth gate. Runs on the Edge runtime, so it only checks that the auth cookie is
 * PRESENT (JWT signature/expiry + role are verified server-side via
 * lib/auth/guard.ts in route handlers). This satisfies "only authenticated users
 * may access the application": unauthenticated page requests are redirected to
 * /login, and unauthenticated /api requests get 401.
 */

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "auth_token";

// Routes reachable without authentication.
const PUBLIC_PAGES = ["/login"];
const PUBLIC_API_PREFIXES = ["/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasToken = Boolean(req.cookies.get(COOKIE_NAME)?.value);

  if (pathname.startsWith("/api")) {
    if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p)) || hasToken) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isPublicPage = PUBLIC_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublicPage || hasToken) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on everything except Next internals and static asset files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$).*)",
  ],
};
