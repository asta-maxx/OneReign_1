import { NextResponse } from "next/server";
import { getROIReport } from "@/lib/reports";
import { requireRole } from "@/lib/auth/guard";

/** GET /api/reports/roi — Fleet Manager / Financial Analyst only. */
export async function GET() {
  const auth = requireRole("Fleet Manager", "Financial Analyst");
  if ("error" in auth) return auth.error;
  return NextResponse.json(await getROIReport());
}
