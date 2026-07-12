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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Operational Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-10 w-32 animate-pulse rounded-md bg-muted"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !cost) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Operational Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">{error || "Data unavailable"}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Operational Cost</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-xl font-bold">${cost.totalCost.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Fuel className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">Fuel</p>
            <p className="text-lg font-semibold">${cost.fuelCost.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-xs text-muted-foreground">Maintenance</p>
            <p className="text-lg font-semibold">${cost.maintenanceCost.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
