import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
}

export function KpiCard({ title, value, icon: Icon, trend, className }: KpiCardProps) {
  return (
    <Card className={cn("transition-all border-hairline bg-canvas", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold text-mute uppercase tracking-widest">{title}</p>
          {Icon && <Icon className="w-5 h-5 text-mute" />}
        </div>
        
        <div className="mt-4">
          <h2 className="font-display text-5xl uppercase tracking-tight text-ink">{value}</h2>
        </div>

        {trend && (
          <div className="mt-4 flex items-center text-xs uppercase tracking-widest font-semibold">
            <span 
              className={cn(
                "flex items-center",
                trend.isPositive ? "text-success" : "text-sale"
              )}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              {trend.value}
            </span>
            {trend.label && (
              <span className="text-mute ml-2">{trend.label}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
