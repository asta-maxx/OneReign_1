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
import { Droplet, DollarSign } from "lucide-react";

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
    <div className="container mx-auto py-8 max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fuel Logs</h1>
        <p className="text-muted-foreground mt-2">Track fuel consumption and costs across the fleet.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Fuel Cost
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentMonthTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total spent on fuel this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Fuel Entry</CardTitle>
          <CardDescription>Record fuel purchases for a vehicle.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateLog} className="grid gap-4 md:grid-cols-5 items-end">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Vehicle</label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle} disabled={isSubmitting}>
                <SelectTrigger>
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
              <label className="text-sm font-medium">Liters</label>
              <Input 
                type="number" 
                step="0.01" 
                min="0"
                placeholder="0.00" 
                value={liters} 
                onChange={e => setLiters(e.target.value)} 
                disabled={isSubmitting} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Cost ($)</label>
              <Input 
                type="number" 
                step="0.01" 
                min="0"
                placeholder="0.00" 
                value={cost} 
                onChange={e => setCost(e.target.value)} 
                disabled={isSubmitting} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                disabled={isSubmitting} 
              />
            </div>

            <Button type="submit" disabled={isSubmitting || !selectedVehicle || !liters || !cost || !date} className="md:col-span-5 w-full md:w-auto md:justify-self-end mt-4">
              <Droplet className="w-4 h-4 mr-2" />
              {isSubmitting ? "Logging..." : "Log Fuel"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fuel History</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
            Sort by Date ({sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground">Loading records...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="text-right">Liters</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No fuel logs found.</TableCell>
                    </TableRow>
                  ) : (
                    sortedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{log.vehicleName}</TableCell>
                        <TableCell className="text-right">{log.liters.toFixed(2)} L</TableCell>
                        <TableCell className="text-right">${log.cost.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
