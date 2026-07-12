import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonKpiCard() {
  return (
    <Card className="shadow-sm border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <Skeleton className="h-10 w-16 mb-4" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export function SkeletonChart() {
  return (
    <Card className="shadow-sm border-border/50 p-6">
      <Skeleton className="h-6 w-48 mb-8" />
      <Skeleton className="h-[300px] w-full" />
    </Card>
  );
}

export function SkeletonTable() {
  return (
    <Card className="shadow-sm border-border/50 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    </Card>
  );
}
