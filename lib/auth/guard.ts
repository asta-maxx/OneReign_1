import { NextResponse } from "next/server";
import { getAuthTokenFromCookies } from "@/lib/auth/cookies";
import { verifyJwt } from "@/lib/auth/jwt";
import type { AuthRole, JwtPayload } from "@/lib/auth/types";

/**
 * Server-side auth guards for route handlers and server components.
 *
 * middleware.ts only checks that the auth cookie is *present* (it runs on the
 * Edge runtime, where jsonwebtoken can't verify). The real signature/expiry +
 * role check happens here (Node runtime), so a forged/expired cookie passes the
 * middleware but is rejected at the route.
 */

/** Verify the cookie's JWT and return the session, or null if missing/invalid. */
export function getSessionUser(): JwtPayload | null {
  const token = getAuthTokenFromCookies();
  if (!token) return null;
  try {
    return verifyJwt(token);
  } catch {
    return null;
  }
}

type GuardResult = { user: JwtPayload } | { error: NextResponse };

/** Require any authenticated user. Usage: `const a = requireAuth(); if ("error" in a) return a.error;` */
export function requireAuth(): GuardResult {
  const user = getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}

/** Require one of the given roles. 401 if unauthenticated, 403 if the role isn't allowed. */
export function requireRole(...roles: AuthRole[]): GuardResult {
  const user = getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!roles.includes(user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}
