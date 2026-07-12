"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Vehicle = {
  id: string;
  type: string;
  status: "Available" | "In Transit" | "Maintenance";
  model: string;
  plate: string;
  year: number;
  nextService: string;
};

const data: Vehicle[] = [
  {
    id: "V-101",
    type: "Sprinter Van",
    status: "Available",
    model: "Mercedes-Benz Sprinter",
    plate: "ABC-1234",
    year: 2022,
    nextService: "2026-08-15",
  },
  {
    id: "V-102",
    type: "Box Truck",
    status: "In Transit",
    model: "Ford E-Series",
    plate: "XYZ-9876",
    year: 2021,
    nextService: "2026-09-01",
  },
  {
    id: "V-103",
    type: "Sedan",
    status: "Maintenance",
    model: "Toyota Camry",
    plate: "LMN-4567",
    year: 2023,
    nextService: "2026-07-20",
  },
  {
    id: "V-104",
    type: "Sprinter Van",
    status: "Available",
    model: "Mercedes-Benz Sprinter",
    plate: "QRS-3456",
    year: 2022,
    nextService: "2026-10-10",
  }
];

export default function VehiclesPage() {
  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <span className="font-medium">{row.getValue("id")}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let variant: "default" | "secondary" | "destructive" | "outline" = "default";
        if (status === "In Transit") variant = "secondary";
        if (status === "Maintenance") variant = "destructive";
        
        return (
          <Badge variant={variant}>
            {status}
          </Badge>
        );
      }
    },
    {
      accessorKey: "model",
      header: "Brand / Model",
    },
    {
      accessorKey: "plate",
      header: "Plate",
    },
    {
      accessorKey: "year",
      header: "Year",
    },
    {
      accessorKey: "nextService",
      header: "Next Service",
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => {
        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
              <Edit2 className="w-3 h-3 mr-1" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
              <Wrench className="w-3 h-3 mr-1" /> Log
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl uppercase tracking-tight text-ink">Vehicle Registry</h1>
          <p className="text-mute mt-1 uppercase tracking-widest text-xs font-semibold">
            Manage your fleet, track statuses, and schedule maintenance.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add Vehicle
        </Button>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  );
}
