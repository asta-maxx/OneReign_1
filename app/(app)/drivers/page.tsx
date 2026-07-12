"use client";

import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, UserSquare2, MessageSquare, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Driver = {
  id: string;
  name: string;
  licenseNo: string;
  status: "Active" | "Off Duty" | "Suspended";
  trips: number;
  rating: number;
};

const data: Driver[] = [
  {
    id: "D-001",
    name: "John Doe",
    licenseNo: "CDL-123456",
    status: "Active",
    trips: 142,
    rating: 4.8,
  },
  {
    id: "D-002",
    name: "Jane Smith",
    licenseNo: "CDL-654321",
    status: "Off Duty",
    trips: 89,
    rating: 4.9,
  },
  {
    id: "D-003",
    name: "Robert Johnson",
    licenseNo: "CDL-789012",
    status: "Suspended",
    trips: 45,
    rating: 3.2,
  },
  {
    id: "D-004",
    name: "Emily Davis",
    licenseNo: "CDL-345678",
    status: "Active",
    trips: 215,
    rating: 5.0,
  }
];

export default function DriversPage() {
  const columns: ColumnDef<Driver>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium text-body-strong">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "licenseNo",
      header: "License No",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let variant: "default" | "secondary" | "destructive" | "outline" = "default";
        
        if (status === "Off Duty") variant = "secondary";
        if (status === "Suspended") variant = "destructive";
        
        return (
          <Badge variant={variant}>
            {status}
          </Badge>
        );
      }
    },
    {
      accessorKey: "trips",
      header: "Total Trips",
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => {
        const rating = row.getValue("rating") as number;
        return (
          <div className="flex items-center gap-1">
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-muted text-xs">/ 5.0</span>
          </div>
        );
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => {
        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
              <UserSquare2 className="w-3 h-3 mr-1" /> Profile
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
              <MessageSquare className="w-3 h-3 mr-1" /> Message
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
              <Ban className="w-3 h-3 mr-1" /> Suspend
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
          <h1 className="font-display text-5xl uppercase tracking-tight text-ink">Drivers & Safety Profiles</h1>
          <p className="text-mute mt-1 uppercase tracking-widest text-xs font-semibold">
            Manage your workforce, monitor safety ratings, and communication.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add Driver
        </Button>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  );
}
