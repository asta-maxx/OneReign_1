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
    <div className="flex flex-col w-64 bg-canvas border-r border-hairline min-h-screen p-6">
      <div className="flex items-center gap-3 mb-10">
        <div className="p-1">
          <Truck className="w-6 h-6 text-ink" />
        </div>
        <div>
          <h1 className="text-2xl font-display uppercase tracking-tight text-ink leading-none">TransitOps</h1>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {routes.map((route) => {
          const isActive = pathname === route.href || (pathname.startsWith(route.href) && route.href !== "/");
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-4 px-3 py-3 rounded-none text-xs uppercase tracking-widest font-semibold transition-colors group",
                isActive 
                  ? "bg-ink text-canvas" 
                  : "text-mute hover:bg-soft-cloud hover:text-ink"
              )}
            >
              <route.icon className={cn("w-4 h-4", isActive ? "text-canvas" : "text-mute group-hover:text-ink")} />
              {route.label}
            </Link>
          );
        })}
      </div>
      <div className="pt-6 mt-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-xs font-semibold text-canvas">
            TO
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-ink">Fleet Admin</p>
            <p className="text-xs text-mute">admin@transitops.com</p>
          </div>
        </div>
        {/* We keep ThemeToggle for now, user can decide later */}
        <ThemeToggle />
      </div>
    </div>
  );
}
