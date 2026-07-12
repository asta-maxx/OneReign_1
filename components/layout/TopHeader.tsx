"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopHeader() {
  const pathname = usePathname();
  
  // Basic breadcrumb logic
  const segments = pathname.split("/").filter(Boolean);
  const currentSegment = segments[segments.length - 1] || "Dashboard";
  const title = currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1);

  return (
    <header className="h-16 border-b border-hairline-soft bg-canvas px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 text-sm text-muted">
        <span>TransitOps</span>
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium text-body-strong capitalize">{title}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="rounded-full text-muted hover:text-body-strong">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-surface-elevated text-body-strong">
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
