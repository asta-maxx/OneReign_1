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
    <header className="h-16 border-b border-hairline bg-canvas px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 text-sm text-mute">
        <span className="uppercase tracking-widest text-xs font-semibold">TransitOps</span>
        <ChevronRight className="w-4 h-4" />
        <span className="font-display text-3xl uppercase tracking-tight text-ink leading-none mt-1">{title}</span>
      </div>
      
      <div className="flex items-center gap-4">
        {/* If ThemeToggle exists in this project, it might be at @/components/ThemeToggle, not @/components/theme-toggle, since Sidebar uses ThemeToggle. I'll just use the imported one. */}
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="rounded-full text-mute hover:text-ink hover:bg-soft-cloud">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-ink text-canvas hover:bg-ink/80 hover:text-canvas">
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
