"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export interface FilterConfig {
  showDateRange?: boolean;
  showStatus?: boolean;
  showRegion?: boolean;
  showVehicle?: boolean;
  showDepartment?: boolean;
}

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  status: string;
  region: string;
  vehicleId: string;
  department: string;
}

interface FilterBarProps {
  config: FilterConfig;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
}

export function FilterBar({ config, filters, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 bg-card border border-border/50 p-4 rounded-lg shadow-sm">
      <div className="text-sm font-medium text-muted-foreground mr-2">Filters</div>
      
      {config.showDateRange && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
            className="w-auto h-9 text-sm"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
            className="w-auto h-9 text-sm"
          />
        </div>
      )}

      {config.showStatus && (
        <Select value={filters.status} onValueChange={(v) => onFilterChange('status', v ?? "")}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      )}

      {config.showRegion && (
        <Select value={filters.region} onValueChange={(v) => onFilterChange('region', v ?? "")}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem value="north">North</SelectItem>
            <SelectItem value="south">South</SelectItem>
            <SelectItem value="east">East</SelectItem>
            <SelectItem value="west">West</SelectItem>
          </SelectContent>
        </Select>
      )}

      {config.showDepartment && (
        <Select value={filters.department} onValueChange={(v) => onFilterChange('department', v ?? "")}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="logistics">Logistics</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="heavy">Heavy Haulage</SelectItem>
          </SelectContent>
        </Select>
      )}

      {config.showVehicle && (
        <Select value={filters.vehicleId} onValueChange={(v) => onFilterChange('vehicleId', v ?? "")}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Vehicle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            <SelectItem value="v1">Volvo FH16</SelectItem>
            <SelectItem value="v2">Scania R500</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
