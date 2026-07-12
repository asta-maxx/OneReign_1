"use client";

import { useEffect, useState } from "react";
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
    <div className="space-y-6">
      {/* Top row - Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-body-strong">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hardcoded sample data for now */}
            <div className="flex items-start gap-3 p-3 bg-semantic-danger/10 text-semantic-danger rounded-md border border-semantic-danger/20">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Vehicle V-104 Engine Light</p>
                <p className="text-xs opacity-80 mt-1">Reported 10 mins ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-semantic-warning/10 text-semantic-warning rounded-md border border-semantic-warning/20">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Driver D-02 Speeding Violation</p>
                <p className="text-xs opacity-80 mt-1">Reported 45 mins ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-body-strong">Fleet Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">V-101 (Sprinter Van)</span>
                <span className="text-xs px-2 py-1 bg-semantic-success/20 text-semantic-success rounded-full font-medium">In Transit</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">V-102 (Box Truck)</span>
                <span className="text-xs px-2 py-1 bg-canvas-deep text-muted rounded-full font-medium">Idle</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">V-103 (Sedan)</span>
                <span className="text-xs px-2 py-1 bg-semantic-warning/20 text-semantic-warning rounded-full font-medium">Maintenance</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
