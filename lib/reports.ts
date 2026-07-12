import { prisma } from "@/lib/prisma";
import { computeFuelEfficiency, computeRoi, toNumber } from "@/lib/calc";

/**
 * Fleet-wide report aggregations that back the dashboard + reports pages.
 * Response shapes match the interfaces in lib/api/reportsClient.ts exactly.
 *
 * All per-vehicle reports are derived from a single set of `groupBy` queries
 * (no N+1): one pass over vehicles + grouped sums for fuel, completed-trip
 * distance/revenue, and maintenance expenses.
 */

interface VehicleAgg {
  id: string;
  name: string;
  regNumber: string;
  status: string;
  acquisitionCost: number;
  fuelCost: number;
  liters: number;
  distance: number; // Σ Completed Trip.distance
  revenue: number; // Σ Completed Trip.revenue
  completedTrips: number;
  maintenanceCost: number; // Σ Expense.amount WHERE type = "Maintenance"
}

const label = (v: { name: string; regNumber: string }) => `${v.name} (${v.regNumber})`;

async function getVehicleAggregates(): Promise<VehicleAgg[]> {
  const [vehicles, fuel, trips, maint] = await Promise.all([
    prisma.vehicle.findMany({
      select: {
        id: true,
        name: true,
        regNumber: true,
        status: true,
        acquisitionCost: true,
      },
    }),
    prisma.fuelLog.groupBy({ by: ["vehicleId"], _sum: { cost: true, liters: true } }),
    prisma.trip.groupBy({
      by: ["vehicleId"],
      where: { status: "Completed" },
      _sum: { distance: true, revenue: true },
      _count: { _all: true },
    }),
    prisma.expense.groupBy({
      by: ["vehicleId"],
      where: { type: "Maintenance" },
      _sum: { amount: true },
    }),
  ]);

  const fuelMap = new Map(fuel.map((f) => [f.vehicleId, f._sum]));
  const tripMap = new Map(trips.map((t) => [t.vehicleId, t]));
  const maintMap = new Map(maint.map((m) => [m.vehicleId, m._sum]));

  return vehicles.map((v) => {
    const f = fuelMap.get(v.id);
    const t = tripMap.get(v.id);
    const m = maintMap.get(v.id);
    return {
      id: v.id,
      name: v.name,
      regNumber: v.regNumber,
      status: v.status,
      acquisitionCost: toNumber(v.acquisitionCost),
      fuelCost: toNumber(f?.cost),
      liters: toNumber(f?.liters),
      distance: toNumber(t?._sum.distance),
      revenue: toNumber(t?._sum.revenue),
      completedTrips: t?._count._all ?? 0,
      maintenanceCost: toNumber(m?.amount),
    };
  });
}

export interface DashboardKPIs {
  activeVehicles: number;
  availableVehicles: number;
  inMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilizationPct: number;
}

export async function getDashboardKPIs(filters?: {
  type?: string;
  status?: string;
  region?: string;
}): Promise<DashboardKPIs> {
  // region is ignored: Vehicle has no region column (Trip does). Documented gap.
  const vehicleWhere: { type?: string; status?: string } = {};
  if (filters?.type && filters.type !== "all") vehicleWhere.type = filters.type;
  if (filters?.status && filters.status !== "all") vehicleWhere.status = filters.status;

  const [vehStatus, tripStatus, driverStatus] = await Promise.all([
    prisma.vehicle.groupBy({ by: ["status"], where: vehicleWhere, _count: { _all: true } }),
    prisma.trip.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.driver.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const vc = Object.fromEntries(vehStatus.map((s) => [s.status, s._count._all]));
  const tc = Object.fromEntries(tripStatus.map((s) => [s.status, s._count._all]));
  const dc = Object.fromEntries(driverStatus.map((s) => [s.status, s._count._all]));

  const available = vc["Available"] ?? 0;
  const onTrip = vc["On Trip"] ?? 0;
  const inShop = vc["In Shop"] ?? 0;
  const nonRetired = available + onTrip + inShop;

  return {
    activeVehicles: nonRetired, // in-service fleet (everything except Retired)
    availableVehicles: available,
    inMaintenance: inShop,
    activeTrips: tc["Dispatched"] ?? 0,
    pendingTrips: tc["Draft"] ?? 0,
    driversOnDuty: (dc["Available"] ?? 0) + (dc["On Trip"] ?? 0),
    fleetUtilizationPct:
      nonRetired > 0 ? parseFloat(((onTrip / nonRetired) * 100).toFixed(1)) : 0,
  };
}

export interface FuelEfficiencyReport {
  vehicleId: string;
  vehicleName: string;
  distanceKm: number;
  litersUsed: number;
  efficiency: number;
}

export async function getFuelEfficiencyReport(): Promise<FuelEfficiencyReport[]> {
  const aggs = await getVehicleAggregates();
  return aggs
    .map((v) => ({
      vehicleId: v.id,
      vehicleName: label(v),
      distanceKm: v.distance,
      litersUsed: v.liters,
      efficiency: computeFuelEfficiency(v.distance, v.liters) ?? 0,
    }))
    .sort((a, b) => b.efficiency - a.efficiency);
}

export interface FleetUtilizationReport {
  vehicleId: string;
  vehicleName: string;
  utilizationPct: number;
  activeDays: number;
  idleDays: number;
}

const UTILIZATION_WINDOW_DAYS = 30;

export async function getFleetUtilizationReport(): Promise<FleetUtilizationReport[]> {
  // APPROXIMATION: there is no per-day activity tracking, so "active days" is
  // proxied by the number of Completed trips (capped at the 30-day window).
  // Replace with real daily telemetry if it becomes available.
  const aggs = await getVehicleAggregates();
  return aggs
    .map((v) => {
      const activeDays = Math.min(UTILIZATION_WINDOW_DAYS, v.completedTrips);
      const idleDays = UTILIZATION_WINDOW_DAYS - activeDays;
      return {
        vehicleId: v.id,
        vehicleName: label(v),
        utilizationPct: parseFloat(((activeDays / UTILIZATION_WINDOW_DAYS) * 100).toFixed(1)),
        activeDays,
        idleDays,
      };
    })
    .sort((a, b) => b.utilizationPct - a.utilizationPct);
}

export interface OperationalCostReport {
  vehicleId: string;
  vehicleName: string;
  fuelCost: number;
  maintenanceCost: number;
  totalCost: number;
}

export async function getOperationalCostReport(
  vehicleId?: string
): Promise<OperationalCostReport[]> {
  let aggs = await getVehicleAggregates();
  if (vehicleId && vehicleId !== "all") aggs = aggs.filter((v) => v.id === vehicleId);
  return aggs
    .map((v) => ({
      vehicleId: v.id,
      vehicleName: label(v),
      fuelCost: v.fuelCost,
      maintenanceCost: v.maintenanceCost,
      totalCost: v.fuelCost + v.maintenanceCost,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);
}

export interface ROIReport {
  vehicleId: string;
  vehicleName: string;
  revenue: number;
  maintenanceCost: number;
  fuelCost: number;
  acquisitionCost: number;
  roi: number; // percentage
}

export async function getROIReport(): Promise<ROIReport[]> {
  const aggs = await getVehicleAggregates();
  return aggs
    .map((v) => {
      const netProfit = v.revenue - (v.fuelCost + v.maintenanceCost);
      const roiRatio = computeRoi(netProfit, v.acquisitionCost);
      return {
        vehicleId: v.id,
        vehicleName: label(v),
        revenue: v.revenue,
        maintenanceCost: v.maintenanceCost,
        fuelCost: v.fuelCost,
        acquisitionCost: v.acquisitionCost,
        roi: roiRatio === null ? 0 : parseFloat((roiRatio * 100).toFixed(2)),
      };
    })
    .sort((a, b) => b.roi - a.roi);
}
