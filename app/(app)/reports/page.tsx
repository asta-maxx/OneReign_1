"use client";

import { useState, useEffect } from "react";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { ReportTable } from "@/components/ReportTable";
import { SkeletonChart, SkeletonTable } from "@/components/SkeletonLoaders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  reportsClient, 
  FuelEfficiencyReport, 
  FleetUtilizationReport, 
  OperationalCostReport, 
  ROIReport 
} from "@/lib/api/reportsClient";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, LineChart, Line
} from "recharts";
import { ChartTooltip } from "@/components/ChartTooltip";
import { cn } from "@/lib/utils";

type ReportTab = "fuel" | "utilization" | "cost" | "roi";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("fuel");
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: "", dateTo: "", status: "all", region: "all", vehicleId: "all", department: "all"
  });
  
  const [loading, setLoading] = useState(false);
  const [fuelData, setFuelData] = useState<FuelEfficiencyReport[]>([]);
  const [utilData, setUtilData] = useState<FleetUtilizationReport[]>([]);
  const [costData, setCostData] = useState<OperationalCostReport[]>([]);
  const [roiData, setRoiData] = useState<ROIReport[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (activeTab === "fuel") {
          const data = await reportsClient.getFuelEfficiency({ department: filters.department });
          setFuelData(data);
        } else if (activeTab === "utilization") {
          const data = await reportsClient.getFleetUtilization();
          setUtilData(data);
        } else if (activeTab === "cost") {
          const data = await reportsClient.getOperationalCost({ vehicleId: filters.vehicleId });
          setCostData(data);
        } else if (activeTab === "roi") {
          const data = await reportsClient.getROI();
          setRoiData(data);
        }
      } catch (error) {
        console.error("Failed to load report data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeTab, filters.department, filters.vehicleId]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const tabs: { id: ReportTab; label: string }[] = [
    { id: "fuel", label: "Fuel Efficiency" },
    { id: "utilization", label: "Fleet Utilization" },
    { id: "cost", label: "Operational Cost" },
    { id: "roi", label: "ROI Analysis" }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-1">
          In-depth analysis of fleet performance and financials.
        </p>
      </div>

      {/* Segmented Control / Tabs */}
      <div className="flex p-1 space-x-1 bg-muted/30 rounded-lg w-fit border border-border/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all",
              activeTab === tab.id 
                ? "bg-card text-foreground shadow-sm border border-border/50" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render Active Tab Content */}
      {activeTab === "fuel" && (
        <div className="space-y-6">
          <FilterBar config={{ showDateRange: true, showDepartment: true }} filters={filters} onFilterChange={handleFilterChange} />
          {loading ? (
            <div className="space-y-6"><SkeletonChart /><SkeletonTable /></div>
          ) : (
            <>
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Efficiency Across Fleet (km/l)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fuelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis dataKey="vehicleName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dx={-10} />
                        <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted)/0.4)" }} />
                        <Bar dataKey="efficiency" radius={[4, 4, 0, 0]} maxBarSize={50} animationDuration={1000}>
                          {fuelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="hsl(var(--primary))" opacity={entry.efficiency < 2 ? 0.5 : 1} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <ReportTable 
                title="Fuel Efficiency Data"
                exportFilename="fuel_efficiency_report.csv"
                columns={[
                  { header: "Vehicle", accessorKey: "vehicleName" },
                  { header: "Distance (km)", accessorKey: "distanceKm", cell: (val) => val.toLocaleString() },
                  { header: "Liters Used", accessorKey: "litersUsed", cell: (val) => val.toLocaleString() },
                  { header: "Efficiency (km/l)", accessorKey: "efficiency", cell: (val) => (
                    <span className={cn("font-medium", val < 2 ? "text-amber-500" : "text-emerald-500")}>{val}</span>
                  )}
                ]} 
                data={fuelData} 
              />
            </>
          )}
        </div>
      )}

      {activeTab === "utilization" && (
        <div className="space-y-6">
          <FilterBar config={{ showDateRange: true }} filters={filters} onFilterChange={handleFilterChange} />
          {loading ? (
            <div className="space-y-6"><SkeletonChart /><SkeletonTable /></div>
          ) : (
            <>
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Fleet Utilization (%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={utilData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis dataKey="vehicleName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dx={-10} />
                        <RechartsTooltip content={<ChartTooltip />} />
                        <Line type="monotone" dataKey="utilizationPct" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }} animationDuration={1000} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <ReportTable 
                title="Fleet Utilization Data"
                exportFilename="fleet_utilization_report.csv"
                columns={[
                  { header: "Vehicle", accessorKey: "vehicleName" },
                  { header: "Utilization %", accessorKey: "utilizationPct", cell: (val) => `${val}%` },
                  { header: "Active Days", accessorKey: "activeDays" },
                  { header: "Idle Days", accessorKey: "idleDays", cell: (val) => (
                    <span className={cn(val > 10 ? "text-destructive" : "")}>{val}</span>
                  )}
                ]} 
                data={utilData} 
              />
            </>
          )}
        </div>
      )}

      {activeTab === "cost" && (
        <div className="space-y-6">
          <FilterBar config={{ showDateRange: true, showVehicle: true }} filters={filters} onFilterChange={handleFilterChange} />
          {loading ? (
            <div className="space-y-6"><SkeletonChart /><SkeletonTable /></div>
          ) : (
            <>
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Operational Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={costData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis dataKey="vehicleName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dx={-10} />
                        <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted)/0.4)" }} />
                        <Bar dataKey="fuelCost" name="Fuel Cost" stackId="a" fill="hsl(var(--primary))" animationDuration={1000} />
                        <Bar dataKey="maintenanceCost" name="Maintenance Cost" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} animationDuration={1000} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <ReportTable 
                title="Operational Cost Data"
                exportFilename="operational_cost_report.csv"
                columns={[
                  { header: "Vehicle", accessorKey: "vehicleName" },
                  { header: "Fuel Cost", accessorKey: "fuelCost", cell: (val) => `$${val.toLocaleString()}` },
                  { header: "Maintenance Cost", accessorKey: "maintenanceCost", cell: (val) => `$${val.toLocaleString()}` },
                  { header: "Total Cost", accessorKey: "totalCost", cell: (val) => <span className="font-semibold text-foreground">${val.toLocaleString()}</span> }
                ]} 
                data={costData} 
              />
            </>
          )}
        </div>
      )}

      {activeTab === "roi" && (
        <div className="space-y-6">
          <FilterBar config={{ showDateRange: true }} filters={filters} onFilterChange={handleFilterChange} />
          {loading ? (
            <div className="space-y-6"><SkeletonTable /></div>
          ) : (
            <ReportTable 
              title="Return on Investment (ROI) Analysis"
              exportFilename="roi_report.csv"
              columns={[
                { header: "Vehicle", accessorKey: "vehicleName" },
                { header: "Revenue", accessorKey: "revenue", cell: (val) => `$${val.toLocaleString()}` },
                { header: "Total Cost", accessorKey: "fuelCost", cell: (val, row) => `$${(row.fuelCost + row.maintenanceCost).toLocaleString()}` },
                { header: "Acquisition Cost", accessorKey: "acquisitionCost", cell: (val) => `$${val.toLocaleString()}` },
                { header: "ROI %", accessorKey: "roi", cell: (val) => (
                  <span className={cn(
                    "font-bold px-2 py-1 rounded-md text-xs",
                    val > 5 ? "bg-emerald-500/10 text-emerald-500" : val < 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"
                  )}>
                    {val > 0 ? "+" : ""}{val}%
                  </span>
                )}
              ]} 
              data={roiData} 
            />
          )}
        </div>
      )}
    </div>
  );
}
