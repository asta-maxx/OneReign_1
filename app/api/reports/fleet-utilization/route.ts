import { NextResponse } from "next/server";
import { getFleetUtilizationReport } from "@/lib/reports";
import { requireRole } from "@/lib/auth/guard";

/** GET /api/reports/fleet-utilization — Fleet Manager / Financial Analyst only. */
export async function GET() {
  const auth = requireRole("Fleet Manager", "Financial Analyst");
  if ("error" in auth) return auth.error;
  return NextResponse.json(await getFleetUtilizationReport());
}
