"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Map, Car, Users, Route, Wrench, Receipt, BarChart, Settings, Truck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { readableResources, type Resource } from "@/lib/auth/rbac";
import type { AuthRole } from "@/lib/auth/types";

const ALL_ROUTES = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    resource: "dashboard" as Resource,
  },
  {
    label: "Live Map",
    icon: Map,
    href: "/operations",
    resource: "dashboard" as Resource, // Live map falls under dashboard visibility
  },
  {
    label: "Vehicle Registry",
    icon: Car,
    href: "/vehicles",
    resource: "vehicles" as Resource,
  },
  {
    label: "Drivers & Safety",
    icon: Users,
    href: "/drivers",
    resource: "drivers" as Resource,
  },
  {
    label: "Trip Dispatcher",
    icon: Route,
    href: "/dispatch",
    resource: "trips" as Resource,
  },
  {
    label: "Maintenance",
    icon: Wrench,
    href: "/maintenance",
    resource: "maintenance" as Resource,
  },
  {
    label: "Fuel & Expenses",
    icon: Receipt,
    href: "/expenses",
    resource: "expenses" as Resource,
  },
  {
    label: "Reports & Analytics",
    icon: BarChart,
    href: "/reports",
    resource: "reports" as Resource,
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    resource: "dashboard" as Resource, // Settings are available to any authenticated user
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email: string; role: AuthRole } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const allowedResources = user ? readableResources(user.role) : [];
  
  const visibleRoutes = ALL_ROUTES.filter((route) => {
    // If we're loading, show nothing to prevent flickering
    if (isLoading) return false;
    return allowedResources.includes(route.resource);
  });

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
        {isLoading ? (
          // Skeleton loader for navigation
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-soft-cloud animate-pulse w-full rounded-sm" />
          ))
        ) : (
          visibleRoutes.map((route) => {
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
          })
        )}
      </div>

      <div className="pt-6 mt-auto flex items-center justify-between">
        {isLoading ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-soft-cloud animate-pulse" />
            <div className="flex flex-col gap-1">
              <div className="w-20 h-3 bg-soft-cloud animate-pulse" />
              <div className="w-24 h-3 bg-soft-cloud animate-pulse" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 shrink-0 rounded-full bg-ink flex items-center justify-center text-xs font-semibold text-canvas">
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs uppercase tracking-widest font-semibold text-ink truncate" title={user.role}>
                {user.role}
              </p>
              <p className="text-xs text-mute truncate" title={user.email}>
                {user.email}
              </p>
            </div>
          </div>
        ) : null}
        
        <div className="flex flex-col gap-2 shrink-0">
          <ThemeToggle />
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="flex items-center justify-center p-2 text-mute hover:text-semantic-error transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
