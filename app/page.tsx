"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, AlertTriangle, Fuel, ArrowUpRight, Wrench, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back. Here's what's happening with your fleet today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/fuel-logs">
            <Button variant="secondary" className="gap-2">
              <Fuel className="w-4 h-4" /> Log Fuel
            </Button>
          </Link>
          <Link href="/maintenance">
            <Button className="gap-2">
              <Wrench className="w-4 h-4" /> New Maintenance
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Vehicles</CardTitle>
            <Truck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">14</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-500" /> <span className="text-emerald-500 font-medium mr-1">+2</span> this month
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vehicles in Shop</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Fuel Cost</CardTitle>
            <Fuel className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$4,250.00</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-500" /> <span className="text-emerald-500 font-medium mr-1">8%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Placeholder for Recent Activity */}
        <Card className="h-96 flex flex-col items-center justify-center text-muted-foreground border-dashed bg-transparent shadow-none">
          <Wrench className="w-10 h-10 mb-4 opacity-20" />
          <p className="font-medium">Recent Maintenance Activity</p>
          <p className="text-sm opacity-60">Chart visualization coming soon</p>
        </Card>
        
        {/* Placeholder for Expenses Chart */}
        <Card className="h-96 flex flex-col items-center justify-center text-muted-foreground border-dashed bg-transparent shadow-none">
          <Receipt className="w-10 h-10 mb-4 opacity-20" />
          <p className="font-medium">Monthly Expenses Breakdown</p>
          <p className="text-sm opacity-60">Chart visualization coming soon</p>
        </Card>
      </div>
    </div>
  );
}
