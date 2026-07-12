"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wrench, Fuel, Receipt, Truck, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Analytics & Reports",
    icon: BarChart,
    href: "/reports",
  },
  {
    label: "Maintenance",
    icon: Wrench,
    href: "/maintenance",
  },
  {
    label: "Fuel Logs",
    icon: Fuel,
    href: "/fuel-logs",
  },
  {
    label: "Expenses",
    icon: Receipt,
    href: "/expenses",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-background border-r border-border/50 min-h-screen p-4">
      <div className="flex items-center gap-3 px-2 py-4 mb-8">
        <div className="p-1">
          <Truck className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground leading-none">TransitOps</h1>
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
                  ? "bg-secondary text-foreground font-medium" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <route.icon className={cn("w-4 h-4", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              {route.label}
            </Link>
          );
        })}
      </div>
      <div className="pt-4 border-t border-border/50 mt-auto">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground">
            TO
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Fleet Admin</p>
            <p className="text-xs text-muted-foreground">admin@transitops.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
