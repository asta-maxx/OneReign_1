import { NextRequest, NextResponse } from "next/server";
import { getOperationalCostReport } from "@/lib/reports";
import { requireRole } from "@/lib/auth/guard";

/** GET /api/reports/operational-cost?vehicleId= — Fleet Manager / Financial Analyst only. */
export async function GET(req: NextRequest) {
  const auth = requireRole("Fleet Manager", "Financial Analyst");
  if ("error" in auth) return auth.error;
  const vehicleId = req.nextUrl.searchParams.get("vehicleId") ?? undefined;
  return NextResponse.json(await getOperationalCostReport(vehicleId));
}
