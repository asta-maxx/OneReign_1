import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/apiHelpers";
import { verifyPassword } from "@/lib/auth/password";
import { signJwt } from "@/lib/auth/jwt";
import { setAuthCookie } from "@/lib/auth/cookies";
import { validateEmail, validatePassword } from "@/lib/auth/validation";

/**
 * POST /api/auth/login
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  try {
    if (!body || typeof body !== "object") {
      return jsonError("Request body is required", 400);
    }

    const record = body as Record<string, unknown>;
    const email = validateEmail(record.email);
    const password = validatePassword(record.password);

    const user = await prisma.user.findUnique({ where: { email } });

    // Generic auth failure message.
    if (!user || !user.password) {
      return jsonError("Invalid credentials", 401);
    }

    const passwordOk = await verifyPassword(password, user.password);
    if (!passwordOk) {
      return jsonError("Invalid credentials", 401);
    }

    const token = signJwt({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    setAuthCookie(token);

    // Never return password.
    const { password: _omit, ...userWithoutPassword } = user;

    return NextResponse.json({ success: true, data: userWithoutPassword });
  } catch (err: unknown) {
    // Validation errors -> 400.
    if (err instanceof Error) {
      if (
        err.message === "email must be a string" ||
        err.message === "email is invalid" ||
        err.message === "password must be a string" ||
        err.message === "password must be at least 8 characters"
      ) {
        return jsonError(err.message, 400);
      }

      console.error("POST /api/auth/login failed", err);
      return jsonError("Internal server error", 500);
    }

    console.error("POST /api/auth/login failed", err);
    return jsonError("Internal server error", 500);
  }
}

