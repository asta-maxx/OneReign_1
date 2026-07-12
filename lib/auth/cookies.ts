import { cookies } from "next/headers";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "auth_token";

export function setAuthCookie(token: string) {
  const cookieStore = cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Keep cookie aligned with JWT expiry as closely as possible.
    // For hackathon demo, a 7-day max-age is acceptable.
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie() {
  const cookieStore = cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getAuthTokenFromCookies(): string | null {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return token ?? null;
}

