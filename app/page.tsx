import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-8">
      <h1 className="text-4xl font-bold tracking-tight">TransitOps Dashboard</h1>
      <p className="text-muted-foreground max-w-md">
        Welcome to the TransitOps fleet management platform.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/maintenance">
          <Button size="lg" className="w-full">Maintenance Logs</Button>
        </Link>
        <Link href="/fuel-logs">
          <Button size="lg" variant="secondary" className="w-full">Fuel Logs</Button>
        </Link>
        <Link href="/expenses">
          <Button size="lg" variant="outline" className="w-full">Expenses</Button>
        </Link>
      </div>
    </div>
  );
}
