// Locally-typed props: recharts v3's TooltipProps no longer exposes payload/label
// directly on the content-component type. recharts still passes these at runtime.
interface ChartTooltipEntry {
  color?: string;
  name?: string | number;
  value?: string | number;
}
interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string | number;
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 shadow-md rounded-md p-3 text-sm">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center text-muted-foreground">
                <span 
                  className="w-2 h-2 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-medium text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
