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
      <Card className={cn("transition-all border-hairline-soft hover:bg-surface-elevated", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted uppercase tracking-wider">{title}</p>
            {Icon && <Icon className="w-4 h-4 text-muted/60" />}
          </div>
          
          <div className="mt-4">
            <h2 className="text-4xl font-semibold tracking-tight tabular-nums text-body-strong">{value}</h2>
          </div>
  
          {trend && (
            <div className="mt-4 flex items-center text-xs">
              <span 
                className={cn(
                  "flex items-center font-medium",
                  trend.isPositive ? "text-semantic-success" : "text-semantic-error"
                )}
              >
              {trend.isPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-1" />
              )}
              {trend.value}
            </span>
            {trend.label && (
              <span className="text-muted-foreground ml-2">{trend.label}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
