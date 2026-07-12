"use client";

import { useEffect, useState } from "react";
import { maintenanceClient } from "@/lib/api/maintenanceClient";
import { Vehicle, MaintenanceRecord } from "@/lib/types";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wrench, Plus, CheckCircle2 } from "lucide-react";

export default function MaintenancePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close dialog state
  const [recordToClose, setRecordToClose] = useState<MaintenanceRecord | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vData, mData] = await Promise.all([
        maintenanceClient.getVehicles(),
        maintenanceClient.getMaintenanceRecords()
      ]);
      setVehicles(vData);
      setRecords(mData);
    } catch (error) {
      toast.error("Failed to load maintenance data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !description.trim()) {
      toast.error("Please select a vehicle and enter a description.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newRecord = await maintenanceClient.createMaintenance(selectedVehicle, description);
      setRecords([newRecord, ...records]);
      
      // Optimistic UI for vehicle status
      setVehicles(prev => prev.map(v => v.id === selectedVehicle ? { ...v, status: 'In Shop' } : v));
      
      toast.success("Maintenance record created successfully.");
      setDescription("");
      setSelectedVehicle("");
    } catch (error) {
      toast.error("Failed to create maintenance record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseRecord = async () => {
    if (!recordToClose) return;

    try {
      setIsClosing(true);
      const updated = await maintenanceClient.closeMaintenance(recordToClose.id);
      setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      
      // Optimistic UI for vehicle status
      setVehicles(prev => prev.map(v => v.id === updated.vehicleId ? { ...v, status: 'Available' } : v));
      
      toast.success("Maintenance record closed.");
      setRecordToClose(null);
    } catch (error) {
      toast.error("Failed to close maintenance record.");
    } finally {
      setIsClosing(false);
    }
  };

  // Only show vehicles not retired for new maintenance
  const eligibleVehicles = vehicles.filter(v => v.status !== 'Retired');

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="p-2 border border-border/50 rounded-md">
          <Wrench className="w-6 h-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maintenance Logs</h1>
          <p className="text-muted-foreground mt-1">Schedule repairs and manage vehicle service history.</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">New Maintenance Record</CardTitle>
          <CardDescription>Log a new repair or service. This will set the vehicle status to &quot;In Shop&quot;.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRecord} className="flex flex-col md:flex-row gap-4 items-start">
            <div className="w-full md:w-1/3">
              <Select value={selectedVehicle} onValueChange={(v) => setSelectedVehicle(v ?? "")} disabled={isSubmitting}>
                <SelectTrigger className="input-ring">
                  <SelectValue placeholder="Select Vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleVehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name} ({v.regNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-2/3 flex gap-4">
              <Input
                placeholder="Description of maintenance..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 input-ring"
              />
              <Button type="submit" disabled={isSubmitting || !selectedVehicle || !description} className="gap-2">
                <Plus className="w-4 h-4" />
                {isSubmitting ? "Logging..." : "Create Log"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border/40">
          <CardTitle className="text-base font-medium">Maintenance History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground animate-pulse">Loading records...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[250px]">Vehicle</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No maintenance records found.</TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => {
                    const vehicle = vehicles.find(v => v.id === record.vehicleId);
                    return (
                      <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {record.vehicleName}
                            {vehicle && (
                              <Badge variant="outline" className={
                                vehicle.status === 'In Shop' ? 'text-amber-500 border-amber-500/30' :
                                vehicle.status === 'Available' ? 'text-emerald-500 border-emerald-500/30' :
                                'text-muted-foreground'
                              }>
                                {vehicle.status}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{record.description}</TableCell>
                        <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{record.closedAt ? new Date(record.closedAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            record.status === 'Active' 
                              ? 'text-amber-500 border-amber-500/50' 
                              : 'text-emerald-500 border-emerald-500/50'
                          }>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          {record.status === 'Active' ? (
                            <Dialog open={recordToClose?.id === record.id} onOpenChange={(open) => !open && setRecordToClose(null)}>
                              <DialogTrigger
                                render={
                                  <Button variant="outline" size="sm" className="hover:text-emerald-500 hover:border-emerald-500/50 transition-colors" onClick={() => setRecordToClose(record)} />
                                }
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Close Record
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Close Maintenance Record</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to close this record? This will mark the vehicle &quot;{record.vehicleName}&quot; as Available again.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="ghost" onClick={() => setRecordToClose(null)} disabled={isClosing}>Cancel</Button>
                                  <Button onClick={handleCloseRecord} disabled={isClosing}>
                                    {isClosing ? "Closing..." : "Confirm Close"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <span className="text-muted-foreground text-sm flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500/70" /> Closed
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
