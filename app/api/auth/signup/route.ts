import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/apiHelpers";
import { hashPassword } from "@/lib/auth/password";
import { validateSignupBody } from "@/lib/auth/validation";

/**
 * POST /api/auth/signup
 * Creates a new user.
 *
 * Notes:
 * - Server-side validation only.
 * - Passwords are bcrypt-hashed.
 * - Duplicate emails are handled via Prisma P2002.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  let validated: { email: string; password: string };
  try {
    validated = validateSignupBody(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return jsonError(message, 400);
  }

  const { email, password } = validated;

  try {
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: email.split("@")[0] ?? "User",
        email,
        password: passwordHash,
        // Keep schema default role (Fleet Manager) as defined in Prisma.
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    return NextResponse.json(
      {
        message: "Signup successful",
        user,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    // Prisma unique constraint violation on `email`.
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return jsonError("Email already registered", 409);
    }

    console.error("POST /api/auth/signup failed", err);
    return jsonError("Internal server error", 500);
  }
}

