import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "auth_token";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    
    // Payload should contain { userId, email, role }
    return NextResponse.json({
      success: true,
      data: {
        email: payload.email,
        role: payload.role,
        userId: payload.userId,
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
