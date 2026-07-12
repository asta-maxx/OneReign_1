import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/apiHelpers";
import { hashPassword } from "@/lib/auth/password";
import { validateSignupBody } from "@/lib/auth/validation";
import { ALL_ROLES } from "@/lib/auth/rbac";
import type { AuthRole } from "@/lib/auth/types";

// Shared invite code required to create any account. Set INVITE_CODE in the env;
// falls back to a documented default for local/demo use.
const INVITE_CODE = process.env.INVITE_CODE ?? "TRANSITOPS-INVITE-2026";

/**
 * POST /api/auth/signup
 * Creates a new user. Requires a valid `inviteCode` and a valid RBAC `role`.
 *
 * Body: { email, password, inviteCode, role, name? }
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

  const record = (body ?? {}) as Record<string, unknown>;

  // Gate account creation behind the invite code.
  if (typeof record.inviteCode !== "string" || record.inviteCode !== INVITE_CODE) {
    return jsonError("A valid invite code is required to sign up", 403);
  }

  // Role must be one of the RBAC roles (no self-assigning arbitrary roles).
  const role = record.role;
  if (!ALL_ROLES.includes(role as AuthRole)) {
    return jsonError(`role must be one of: ${ALL_ROLES.join(", ")}`, 400);
  }

  const { email, password } = validated;
  const name =
    typeof record.name === "string" && record.name.trim().length > 0
      ? record.name.trim()
      : (email.split("@")[0] ?? "User");

  try {
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: role as AuthRole,
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

