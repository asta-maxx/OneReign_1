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
import { Badge } from "@/components/ui/badge";
import { Receipt, Plus, ArrowUpDown } from "lucide-react";

export default function ExpensesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [type, setType] = useState<'Toll' | 'Maintenance' | 'Other' | "">("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
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
    if (!selectedVehicle || !type || !amount || !description || !date) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newExpense = await maintenanceClient.createExpense(
        selectedVehicle, 
        type as any, 
        parseFloat(amount), 
        description,
        date
      );
      setExpenses(prev => [newExpense, ...prev]);
      
      toast.success("Expense logged successfully.");
      setAmount("");
      setDescription("");
      setType("");
    } catch (error) {
      toast.error("Failed to log expense.");
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
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="p-2 border border-border/50 rounded-md">
          <Receipt className="w-6 h-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track tolls, maintenance, and other fleet costs.</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Log New Expense</CardTitle>
          <CardDescription>Record an operational expense for a vehicle.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateExpense} className="grid gap-6 md:grid-cols-6 items-end">
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
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <Select value={type} onValueChange={(val: any) => setType(val)} disabled={isSubmitting}>
                <SelectTrigger className="input-ring">
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
              <label className="text-sm font-medium text-muted-foreground">Amount ($)</label>
              <Input 
                type="number" 
                step="0.01" 
                min="0"
                placeholder="0.00" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                disabled={isSubmitting} 
                className="input-ring"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <Input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                disabled={isSubmitting} 
                className="input-ring"
              />
            </div>

            <div className="space-y-2 md:col-span-4">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <Input 
                placeholder="Brief description of the expense..." 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                disabled={isSubmitting} 
                className="input-ring"
              />
            </div>

            <Button type="submit" disabled={isSubmitting || !selectedVehicle || !type || !amount || !description || !date} className="md:col-span-2 w-full mt-2 gap-2">
              <Plus className="w-4 h-4" />
              {isSubmitting ? "Logging..." : "Log Expense"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-muted/30 border-b border-border/40">
          <CardTitle className="text-base font-medium">Expense History</CardTitle>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right pr-6">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No expenses found.</TableCell>
                  </TableRow>
                ) : (
                  sortedExpenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-muted-foreground">{expense.vehicleName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          expense.type === 'Toll' ? 'text-blue-500 border-blue-500/30' :
                          expense.type === 'Maintenance' ? 'text-amber-500 border-amber-500/30' :
                          'text-muted-foreground border-border'
                        }>
                          {expense.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate" title={expense.description}>
                        {expense.description}
                      </TableCell>
                      <TableCell className="text-right font-mono pr-6">${expense.amount.toFixed(2)}</TableCell>
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
