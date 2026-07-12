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
    <div className="container mx-auto py-8 max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Maintenance Logs</h1>
        <p className="text-muted-foreground mt-2">Manage vehicle repairs and routine maintenance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Maintenance Record</CardTitle>
          <CardDescription>Log a new repair or service. This will set the vehicle status to &quot;In Shop&quot;.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRecord} className="flex flex-col md:flex-row gap-4 items-start">
            <div className="w-full md:w-1/3">
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle} disabled={isSubmitting}>
                <SelectTrigger>
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
                className="flex-1"
              />
              <Button type="submit" disabled={isSubmitting || !selectedVehicle || !description}>
                {isSubmitting ? "Logging..." : "Create Log"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground">Loading records...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Closed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No maintenance records found.</TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => {
                      const vehicle = vehicles.find(v => v.id === record.vehicleId);
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {record.vehicleName}
                              {vehicle && (
                                <Badge variant="outline" className={
                                  vehicle.status === 'In Shop' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                                  vehicle.status === 'Available' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                                  'text-muted-foreground'
                                }>
                                  {vehicle.status}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{record.description}</TableCell>
                          <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{record.closedAt ? new Date(record.closedAt).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            <Badge variant={record.status === 'Active' ? 'default' : 'secondary'} className={
                              record.status === 'Active' ? 'bg-amber-500 hover:bg-amber-600' : ''
                            }>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {record.status === 'Active' && (
                              <Dialog open={recordToClose?.id === record.id} onOpenChange={(open) => !open && setRecordToClose(null)}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setRecordToClose(record)}>
                                    Close Record
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Close Maintenance Record</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to close this record? This will mark the vehicle &quot;{record.vehicleName}&quot; as Available again.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setRecordToClose(null)} disabled={isClosing}>Cancel</Button>
                                    <Button onClick={handleCloseRecord} disabled={isClosing}>
                                      {isClosing ? "Closing..." : "Confirm Close"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
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
