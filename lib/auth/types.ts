export type AuthRole =
  | "Fleet Manager"
  | "Driver"
  | "Safety Officer"
  | "Financial Analyst";

export interface JwtPayload {
  userId: string;
  email: string;
  role: AuthRole;
}

