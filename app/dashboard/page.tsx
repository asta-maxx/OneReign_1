"use client";

import { useEffect, useState } from "react";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { KpiCard } from "@/components/KpiCard";
import { SkeletonKpiCard, SkeletonChart } from "@/components/SkeletonLoaders";
import { reportsClient, DashboardKPIs, FleetUtilizationReport } from "@/lib/api/reportsClient";
import { Truck, CheckCircle2, AlertTriangle, Route, Clock, Users, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartTooltip } from "@/components/ChartTooltip";

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: "", dateTo: "", status: "all", region: "all", vehicleId: "all", department: "all"
  });
  
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [utilizationData, setUtilizationData] = useState<FleetUtilizationReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [kpiData, utilData] = await Promise.all([
          reportsClient.getDashboardKPIs({ status: filters.status, region: filters.region }),
          reportsClient.getFleetUtilization() // Fetching some chart data for the dashboard
        ]);
        setKpis(kpiData);
        setUtilizationData(utilData.slice(0, 6)); // Top 6 for the chart
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
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          High-level overview of your fleet operations.
        </p>
      </div>

      <FilterBar 
        config={{ showStatus: true, showRegion: true }} 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {loading || !kpis ? (
          Array.from({ length: 7 }).map((_, i) => <SkeletonKpiCard key={i} />)
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

      <div className="mt-8">
        {loading ? (
          <SkeletonChart />
        ) : (
          <Card className="shadow-sm border border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Top Vehicle Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="vehicleName" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      dx={-10}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted)/0.4)" }} />
                    <Area 
                      type="monotone" 
                      dataKey="utilizationPct" 
                      name="Utilization %"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorUtil)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
