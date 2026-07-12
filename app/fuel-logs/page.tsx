"use client";

import { useEffect, useState, useMemo } from "react";
import { maintenanceClient } from "@/lib/api/maintenanceClient";
import { Vehicle, FuelLog } from "@/lib/types";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Droplet, DollarSign, Plus, ArrowUpDown } from "lucide-react";

export default function FuelLogsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [liters, setLiters] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sorting
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vData, fData] = await Promise.all([
        maintenanceClient.getVehicles(),
        maintenanceClient.getFuelLogs()
      ]);
      setVehicles(vData);
      setFuelLogs(fData);
    } catch (error) {
      toast.error("Failed to load fuel data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !liters || !cost || !date) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newLog = await maintenanceClient.createFuelLog(
        selectedVehicle, 
        parseFloat(liters), 
        parseFloat(cost), 
        date
      );
      setFuelLogs(prev => [newLog, ...prev]);
      
      toast.success("Fuel log added successfully.");
      setLiters("");
      setCost("");
    } catch (error) {
      toast.error("Failed to add fuel log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedLogs = useMemo(() => {
    return [...fuelLogs].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [fuelLogs, sortOrder]);

  const currentMonthTotal = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return fuelLogs.reduce((total, log) => {
      const logDate = new Date(log.date);
      if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
        return total + log.cost;
      }
      return total;
    }, 0);
  }, [fuelLogs]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="p-2 border border-border/50 rounded-md">
          <Droplet className="w-6 h-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fuel Logs</h1>
          <p className="text-muted-foreground mt-1">Track fuel consumption and costs across the fleet.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Fuel Cost
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${currentMonthTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total spent on fuel this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Log Fuel Entry</CardTitle>
          <CardDescription>Record fuel purchases for a vehicle.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateLog} className="grid gap-6 md:grid-cols-5 items-end">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Vehicle</label>
              <Select value={selectedVehicle} onValueChange={(v) => setSelectedVehicle(v ?? "")} disabled={isSubmitting}>
                <SelectTrigger className="input-ring">
                  <SelectValue placeholder="Select Vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name} ({v.regNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Liters</label>
              <Input 
                type="number" 
                step="0.01" 
                min="0"
                placeholder="0.00" 
                value={liters} 
                onChange={e => setLiters(e.target.value)} 
                disabled={isSubmitting} 
                className="input-ring"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Total Cost ($)</label>
              <Input 
                type="number" 
                step="0.01" 
                min="0"
                placeholder="0.00" 
                value={cost} 
                onChange={e => setCost(e.target.value)} 
                disabled={isSubmitting} 
                className="input-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <Input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                disabled={isSubmitting} 
                className="input-ring"
              />
            </div>

            <Button type="submit" disabled={isSubmitting || !selectedVehicle || !liters || !cost || !date} className="md:col-span-5 w-full md:w-auto md:justify-self-end mt-2 gap-2">
              <Plus className="w-4 h-4" />
              {isSubmitting ? "Logging..." : "Log Fuel"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-muted/30 border-b border-border/40">
          <CardTitle className="text-base font-medium">Fuel History</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="gap-2">
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground animate-pulse">Loading records...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Liters</TableHead>
                  <TableHead className="text-right pr-6">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No fuel logs found.</TableCell>
                  </TableRow>
                ) : (
                  sortedLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{new Date(log.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-muted-foreground">{log.vehicleName}</TableCell>
                      <TableCell className="text-right font-mono">{log.liters.toFixed(2)} L</TableCell>
                      <TableCell className="text-right font-mono pr-6">${log.cost.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
