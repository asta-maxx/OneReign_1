"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, Car, Users, Route, Wrench, Receipt, BarChart, Settings, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Live Map",
    icon: Map,
    href: "/operations",
  },
  {
    label: "Vehicle Registry",
    icon: Car,
    href: "/vehicles",
  },
  {
    label: "Drivers & Safety",
    icon: Users,
    href: "/drivers",
  },
  {
    label: "Trip Dispatcher",
    icon: Route,
    href: "/dispatch",
  },
  {
    label: "Maintenance",
    icon: Wrench,
    href: "/maintenance",
  },
  {
    label: "Fuel & Expenses",
    icon: Receipt,
    href: "/expenses",
  },
  {
    label: "Reports & Analytics",
    icon: BarChart,
    href: "/reports",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

import { ThemeToggle } from "@/components/ThemeToggle";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-canvas border-r border-hairline-soft min-h-screen p-4">
      <div className="flex items-center gap-3 px-2 py-4 mb-8">
        <div className="p-1">
          <Truck className="w-5 h-5 text-body-strong" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-body-strong leading-none">TransitOps</h1>
        </div>
      </div>
      <div className="flex-1 space-y-1">
        {routes.map((route) => {
          const isActive = pathname === route.href || (pathname.startsWith(route.href) && route.href !== "/");
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group",
                isActive 
                  ? "bg-surface-elevated text-body-strong font-medium" 
                  : "text-muted hover:bg-surface-elevated/50 hover:text-body-strong"
              )}
            >
              <route.icon className={cn("w-4 h-4", isActive ? "text-body-strong" : "text-muted group-hover:text-body-strong")} />
              {route.label}
            </Link>
          );
        })}
      </div>
      <div className="pt-4 border-t border-hairline-soft mt-auto flex items-center justify-between">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-medium text-muted">
            TO
          </div>
          <div>
            <p className="text-sm font-medium text-body-strong">Fleet Admin</p>
            <p className="text-xs text-muted">admin@transitops.com</p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}
