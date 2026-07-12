import type { AuthRole } from "@/lib/auth/types";

/**
 * Role-Based Access Control matrix.
 *
 * Derived directly from the four target-user roles:
 *  - Fleet Manager    → fleet assets, maintenance, vehicle lifecycle, operational efficiency
 *  - Driver           → creates trips, assigns vehicles/drivers, monitors deliveries
 *  - Safety Officer   → driver compliance, license validity, safety scores
 *  - Financial Analyst→ expenses, fuel, maintenance costs, profitability
 *
 * This module is pure (no Node/Prisma imports) so it can run in Edge middleware.
 */

export type Resource =
  | "dashboard"
  | "vehicles"
  | "drivers"
  | "trips"
  | "maintenance"
  | "expenses"
  | "reports";

export type Action = "read" | "write";

export const ALL_ROLES: AuthRole[] = [
  "Fleet Manager",
  "Driver",
  "Safety Officer",
  "Financial Analyst",
];

// Resource → allowed actions, per role. Missing resource = no access.
const MATRIX: Record<AuthRole, Partial<Record<Resource, Action[]>>> = {
  "Fleet Manager": {
    dashboard: ["read"],
    vehicles: ["read", "write"], // owns fleet assets + vehicle lifecycle
    drivers: ["read", "write"],
    trips: ["read", "write"],
    maintenance: ["read", "write"], // owns maintenance
    expenses: ["read"],
    reports: ["read"], // operational efficiency
  },
  Driver: {
    dashboard: ["read"],
    vehicles: ["read"], // to assign to trips
    drivers: ["read"], // to assign to trips
    trips: ["read", "write"], // creates/dispatches trips, monitors deliveries
  },
  "Safety Officer": {
    dashboard: ["read"],
    vehicles: ["read"],
    drivers: ["read", "write"], // compliance, license validity, safety scores
    trips: ["read"], // monitors compliance on trips
  },
  "Financial Analyst": {
    dashboard: ["read"],
    vehicles: ["read"],
    trips: ["read"],
    maintenance: ["read"], // maintenance costs
    expenses: ["read", "write"], // expenses + fuel
    reports: ["read"], // profitability, cost, ROI
  },
};

/** Whether `role` may perform `action` on `resource`. */
export function can(role: string, resource: Resource, action: Action): boolean {
  const perms = (MATRIX as Record<string, Partial<Record<Resource, Action[]>>>)[role];
  return perms?.[resource]?.includes(action) ?? false;
}

/** All resources a role can read — handy for building nav / audits. */
export function readableResources(role: AuthRole): Resource[] {
  const perms = MATRIX[role];
  return (Object.keys(perms) as Resource[]).filter((r) => perms[r]?.includes("read"));
}

/**
 * Map a request path (page or API) to the RBAC resource it touches.
 * Returns null when no specific permission applies (authenticated-only).
 */
export function resourceForPath(pathname: string): Resource | null {
  // Financial sub-resources nested under /api/vehicles/:id/...
  if (pathname.includes("/operational-cost") || pathname.includes("/roi")) {
    return "reports";
  }

  // API routes
  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/dashboard")) return "dashboard";
    if (pathname.startsWith("/api/reports")) return "reports";
    if (pathname.startsWith("/api/analytics")) return "reports";
    if (pathname.startsWith("/api/vehicles")) return "vehicles";
    if (pathname.startsWith("/api/drivers")) return "drivers";
    if (pathname.startsWith("/api/trips")) return "trips";
    if (pathname.startsWith("/api/maintenance")) return "maintenance";
    if (pathname.startsWith("/api/fuel-logs")) return "expenses";
    if (pathname.startsWith("/api/expenses")) return "expenses";
    return null;
  }

  // Pages
  if (pathname === "/dashboard") return "dashboard";
  if (pathname.startsWith("/operations")) return "dashboard"; // live map — all authenticated roles
  if (pathname.startsWith("/vehicles")) return "vehicles";
  if (pathname.startsWith("/drivers")) return "drivers";
  if (pathname.startsWith("/dispatch")) return "trips"; // Trip Dispatcher page
  if (pathname.startsWith("/maintenance")) return "maintenance";
  if (pathname.startsWith("/expenses")) return "expenses"; // Fuel & Expenses page
  if (pathname.startsWith("/reports")) return "reports";
  if (pathname.startsWith("/settings")) return "dashboard"; // visible to any authenticated user
  return null;
}
