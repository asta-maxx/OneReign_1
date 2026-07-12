import { prisma } from "@/lib/prisma";
import { getOperationalCost } from "@/lib/operationalCost";
import { computeRoi } from "@/lib/calc";

/**
 * Vehicle ROI.
 *
 * ASSUMPTION (flag for the team): trips earn revenue via `Trip.revenue`, and ROI
 * is measured against the vehicle's capital cost. If revenue is modelled
 * differently (e.g. per-km rate, or a separate billing table), change the
 * `totalRevenue` source below — the rest of the formula is unaffected.
 *
 * Formula:
 *   totalRevenue    = Σ Trip.revenue WHERE status = "Completed"
 *   operationalCost = fuelCost + maintenanceCost   (from getOperationalCost)
 *   netProfit       = totalRevenue - operationalCost
 *   roi             = netProfit / acquisitionCost   (null when acquisitionCost = 0,
 *                                                    to avoid divide-by-zero)
 */
export interface VehicleROI {
  vehicleId: string;
  totalRevenue: number;
  operationalCost: number;
  netProfit: number;
  acquisitionCost: number;
  roi: number | null; // ratio (netProfit / acquisitionCost)
  roiPercent: number | null; // roi * 100
}

export async function getVehicleROI(vehicleId: string): Promise<VehicleROI> {
  const [vehicle, revenueAgg, opCost] = await Promise.all([
    prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { acquisitionCost: true },
    }),
    prisma.trip.aggregate({
      where: { vehicleId, status: "Completed" },
      _sum: { revenue: true },
    }),
    getOperationalCost(vehicleId),
  ]);

  const acquisitionCost = vehicle ? Number(vehicle.acquisitionCost) : 0;
  const totalRevenue =
    revenueAgg._sum.revenue == null ? 0 : Number(revenueAgg._sum.revenue);
  const operationalCost = opCost.totalCost;
  const netProfit = totalRevenue - operationalCost;
  const roi = computeRoi(netProfit, acquisitionCost);

  return {
    vehicleId,
    totalRevenue,
    operationalCost,
    netProfit,
    acquisitionCost,
    roi,
    roiPercent: roi === null ? null : roi * 100,
  };
}
