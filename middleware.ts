import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { can, resourceForPath, type Action } from "@/lib/auth/rbac";
import type { AuthRole } from "@/lib/auth/types";

/**
 * Central auth + RBAC gate (runs on every page/API request).
 *
 * Unlike a cookie-presence check, this VERIFIES the JWT signature/expiry using
 * `jose` (Edge-compatible, unlike jsonwebtoken), then enforces the RBAC matrix in
 * lib/auth/rbac.ts:
 *   - unauthenticated  → /login (pages) or 401 (api)
 *   - authenticated but not permitted → /dashboard?denied=… (pages) or 403 (api)
 */

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "auth_token";
const PUBLIC_PAGES = ["/login", "/register"];
const PUBLIC_API_PREFIXES = ["/api/auth"];

function isRole(v: unknown): v is AuthRole {
  return (
    v === "Fleet Manager" ||
    v === "Driver" ||
    v === "Safety Officer" ||
    v === "Financial Analyst"
  );
}

async function roleFromToken(token: string): Promise<AuthRole | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return isRole(payload.role) ? payload.role : null;
  } catch {
    return null; // bad signature / expired
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isApi = pathname.startsWith("/api");
  const isPublic =
    PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p)) ||
    PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const role = token ? await roleFromToken(token) : null;

  // 1) Authentication
  if (!role) {
    if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 2) Authorization (RBAC)
  const resource = resourceForPath(pathname);
  if (resource) {
    const action: Action = req.method === "GET" ? "read" : "write";
    if (!can(role, resource, action)) {
      if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("denied", resource);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$).*)",
  ],
};
