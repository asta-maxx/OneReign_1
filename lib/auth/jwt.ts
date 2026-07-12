import jwt from "jsonwebtoken";
import type { AuthRole, JwtPayload } from "@/lib/auth/types";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail closed: without a secret, the server cannot authenticate.
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
};

const getJwtExpiresIn = (): string => {
  return process.env.JWT_EXPIRES_IN ?? "7d";
};

export function signJwt(payload: JwtPayload): string {
  const secret = getJwtSecret();

  // Keep JWT payload minimal.
  const token = jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role as AuthRole,
    },
    secret,
    {
      expiresIn: getJwtExpiresIn() as any,
    }
  );

  return token;
}

export function verifyJwt(token: string): JwtPayload {
  const secret = getJwtSecret();

  const decoded = jwt.verify(token, secret) as jwt.JwtPayload & {
    userId?: string;
    email?: string;
    role?: string;
  };

  if (!decoded?.userId || typeof decoded.userId !== "string") {
    throw new Error("Invalid token: missing userId");
  }
  if (!decoded?.email || typeof decoded.email !== "string") {
    throw new Error("Invalid token: missing email");
  }

  const role = decoded.role;
  if (
    role !== "Fleet Manager" &&
    role !== "Driver" &&
    role !== "Safety Officer" &&
    role !== "Financial Analyst"
  ) {
    throw new Error("Invalid token: invalid role");
  }

  return {
    userId: decoded.userId,
    email: decoded.email,
    role: role as AuthRole,
  };
}

