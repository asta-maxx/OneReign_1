"use client";

import { useEffect, useState, useMemo } from "react";
import { maintenanceClient } from "@/lib/api/maintenanceClient";
import { Vehicle, Expense } from "@/lib/types";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ExpensesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sorting
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vData, eData] = await Promise.all([
        maintenanceClient.getVehicles(),
        maintenanceClient.getExpenses()
      ]);
      setVehicles(vData);
      setExpenses(eData);
    } catch (error) {
      toast.error("Failed to load expense data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !type || !amount || !date) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newExpense = await maintenanceClient.createExpense(
        selectedVehicle, 
        type,
        parseFloat(amount), 
        date
      );
      setExpenses(prev => [newExpense, ...prev]);
      
      toast.success("Expense added successfully.");
      setAmount("");
      setType("");
    } catch (error) {
      toast.error("Failed to add expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [expenses, sortOrder]);

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground mt-2">Log tolls, maintenance payments, and other vehicle-related costs.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Expense</CardTitle>
          <CardDescription>Record an expense for a specific vehicle.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateExpense} className="grid gap-4 md:grid-cols-5 items-end">
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
              <label className="text-sm font-medium">Type</label>
              <Select value={type} onValueChange={setType} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Toll">Toll</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount ($)</label>
              <Input 
                type="number" 
                step="0.01" 
                min="0"
                placeholder="0.00" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
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

            <Button type="submit" disabled={isSubmitting || !selectedVehicle || !type || !amount || !date} className="md:col-span-5 w-full md:w-auto md:justify-self-end mt-4">
              <Receipt className="w-4 h-4 mr-2" />
              {isSubmitting ? "Logging..." : "Log Expense"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Expense History</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
            Sort by Date ({sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground">Loading expenses...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No expenses found.</TableCell>
                    </TableRow>
                  ) : (
                    sortedExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{expense.vehicleName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
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
