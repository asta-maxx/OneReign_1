import { NextRequest, NextResponse } from "next/server";
import { getDashboardKPIs } from "@/lib/reports";

/** GET /api/dashboard/kpis?type=&status=&region= */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const kpis = await getDashboardKPIs({
    type: sp.get("type") ?? undefined,
    status: sp.get("status") ?? undefined,
    region: sp.get("region") ?? undefined,
  });
  return NextResponse.json(kpis);
}
