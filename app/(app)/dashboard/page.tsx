"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { KpiCard } from "@/components/KpiCard";
import { SkeletonKpiCard, SkeletonChart } from "@/components/SkeletonLoaders";
import { reportsClient, DashboardKPIs, FleetUtilizationReport } from "@/lib/api/reportsClient";
import { Truck, CheckCircle2, AlertTriangle, Route, Clock, Users, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: "", dateTo: "", status: "all", region: "all", vehicleId: "all", department: "all"
  });
  
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const kpiData = await reportsClient.getDashboardKPIs({ status: filters.status, region: filters.region });
        setKpis(kpiData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [filters.status, filters.region]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Top row - Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading || !kpis ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonKpiCard key={i} />)
        ) : (
          <>
            <KpiCard 
              title="Active Vehicles" 
              value={kpis.activeVehicles} 
              icon={Truck} 
              trend={{ value: "+2", isPositive: true, label: "from yesterday" }}
            />
            <KpiCard 
              title="Available Vehicles" 
              value={kpis.availableVehicles} 
              icon={CheckCircle2} 
            />
            <KpiCard 
              title="In Maintenance" 
              value={kpis.inMaintenance} 
              icon={AlertTriangle} 
              trend={{ value: "1", isPositive: false, label: "critical" }}
            />
          </>
        )}
      </div>

      {/* Second row - Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading || !kpis ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonKpiCard key={`sub-${i}`} />)
        ) : (
          <>
            <KpiCard 
              title="Fleet Utilization" 
              value={`${kpis.fleetUtilizationPct}%`} 
              icon={Activity} 
              trend={{ value: "+4.2%", isPositive: true }}
            />
            <KpiCard 
              title="Active Trips" 
              value={kpis.activeTrips} 
              icon={Route} 
            />
            <KpiCard 
              title="Pending Trips" 
              value={kpis.pendingTrips} 
              icon={Clock} 
            />
            <KpiCard 
              title="Drivers On Duty" 
              value={kpis.driversOnDuty} 
              icon={Users} 
            />
          </>
        )}
      </div>

      {/* Third row - Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
        {/* Recent Alerts */}
        <Card className="bg-canvas">
          <CardHeader>
            <CardTitle className="font-display text-2xl uppercase tracking-widest text-ink">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {kpis?.recentAlerts?.length === 0 ? (
              <p className="text-sm text-mute italic">No recent alerts.</p>
            ) : (
              kpis?.recentAlerts?.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-4 bg-soft-cloud text-ink border-l-4 border-sale">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-sale" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest">{alert.title}</p>
                    <p className="text-xs text-mute mt-1 uppercase tracking-widest">{alert.timeAgo}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Fleet Status */}
        <Card className="bg-canvas">
          <CardHeader>
            <CardTitle className="font-display text-2xl uppercase tracking-widest text-ink">Fleet Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {kpis?.fleetStatus?.length === 0 ? (
                <p className="text-sm text-mute italic">No active fleet status.</p>
              ) : (
                kpis?.fleetStatus?.map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center justify-between border-b border-hairline pb-4 last:border-0 last:pb-0">
                    <span className="text-sm font-medium text-ink uppercase tracking-widest">{vehicle.name}</span>
                    <span className={cn("text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-widest", vehicle.colorClass)}>
                      {vehicle.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
