import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/analytics
 * Fleet-wide KPIs for the dashboard. All figures are computed with aggregate
 * queries (no per-vehicle N+1).
 *
 * Formulas:
 *   totalOperationalCost = Σ FuelLog.cost (fleet)
 *                        + Σ Expense.amount WHERE type="Maintenance" (fleet)
 *   fleetFuelEfficiency  = Σ Trip.distance (Completed) / Σ FuelLog.liters
 *                          (null when no litres — avoids divide-by-zero)
 *   utilization          = vehicles "On Trip" / active (non-Retired) vehicles
 *                          (null when there are no active vehicles)
 */
export async function GET() {
  const [statusGroups, fuelAgg, maintAgg, distanceAgg, litersAgg, vehicleCount] =
    await Promise.all([
      prisma.vehicle.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.fuelLog.aggregate({ _sum: { cost: true } }),
      prisma.expense.aggregate({
        where: { type: "Maintenance" },
        _sum: { amount: true },
      }),
      prisma.trip.aggregate({
        where: { status: "Completed" },
        _sum: { distance: true },
      }),
      prisma.fuelLog.aggregate({ _sum: { liters: true } }),
      prisma.vehicle.count(),
    ]);

  const num = (v: unknown) => (v == null ? 0 : Number(v));

  const statusCounts: Record<string, number> = {};
  for (const g of statusGroups) statusCounts[g.status] = g._count._all;

  const fuelCost = num(fuelAgg._sum.cost);
  const maintenanceCost = num(maintAgg._sum.amount);
  const totalDistance = num(distanceAgg._sum.distance);
  const totalLiters = num(litersAgg._sum.liters);

  const activeVehicles = vehicleCount - (statusCounts["Retired"] ?? 0);

  return NextResponse.json({
    vehicleCount,
    statusCounts,
    totalOperationalCost: fuelCost + maintenanceCost,
    fuelCost,
    maintenanceCost,
    // null (not 0) signals "no data yet" so the UI can distinguish it from 0.
    fleetFuelEfficiency: totalLiters > 0 ? totalDistance / totalLiters : null,
    utilization:
      activeVehicles > 0
        ? (statusCounts["On Trip"] ?? 0) / activeVehicles
        : null,
  });
}
