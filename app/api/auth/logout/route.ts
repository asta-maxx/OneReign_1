import { NextResponse } from "next/server";

import { jsonError } from "@/lib/apiHelpers";
import { clearAuthCookie } from "@/lib/auth/cookies";

/**
 * POST /api/auth/logout
 */
export async function POST() {
  try {
    clearAuthCookie();

    return NextResponse.json({
      success: true,
    });
  } catch (err: unknown) {
    console.error("POST /api/auth/logout failed", err);

    return jsonError("Internal server error", 500);
  }
}