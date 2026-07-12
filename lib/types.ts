export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';

export interface Vehicle {
  id: string;
  regNumber: string;
  name: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
}

export type MaintenanceStatus = 'Active' | 'Closed';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleName?: string;
  description: string;
  status: MaintenanceStatus;
  createdAt: string;
  closedAt?: string | null;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  vehicleName?: string;
  liters: number;
  cost: number;
  date: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  vehicleName?: string;
  type: string; // 'Toll', 'Maintenance', 'Other'
  amount: number;
  date: string;
}

export interface OperationalCost {
  fuelCost: number;
  maintenanceCost: number;
  totalCost: number;
}
