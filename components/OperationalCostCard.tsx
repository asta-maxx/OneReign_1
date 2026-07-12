"use client";

import { useEffect, useState } from "react";
import { maintenanceClient } from "@/lib/api/maintenanceClient";
import { OperationalCost } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDollarSign, Wrench, Fuel } from "lucide-react";

export function OperationalCostCard({ vehicleId }: { vehicleId: string }) {
  const [cost, setCost] = useState<OperationalCost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCost() {
      try {
        setLoading(true);
        setError(null);
        const data = await maintenanceClient.getOperationalCost(vehicleId);
        setCost(data);
      } catch (err) {
        setError("Failed to load operational cost");
      } finally {
        setLoading(false);
      }
    }
    loadCost();
  }, [vehicleId]);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Operational Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-12 w-48 animate-pulse rounded-md bg-muted/50"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !cost) {
    return (
      <Card className="shadow-sm border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Operational Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive font-medium">{error || "Data unavailable"}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">Operational Cost</CardTitle>
      </CardHeader>
      
      <CardContent className="grid gap-6 md:grid-cols-3">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-muted rounded-lg">
            <BadgeDollarSign className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-semibold font-mono">${cost.totalCost.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="p-2 bg-muted rounded-lg">
            <Fuel className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Fuel</p>
            <p className="text-lg font-medium font-mono">${cost.fuelCost.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="p-2 bg-muted rounded-lg">
            <Wrench className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Maintenance</p>
            <p className="text-lg font-medium font-mono">${cost.maintenanceCost.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
