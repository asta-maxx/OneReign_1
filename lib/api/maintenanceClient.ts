import { Vehicle, MaintenanceRecord, FuelLog, Expense, OperationalCost } from '../types';

const USE_MOCK_API = true;

// Mock Data
let mockVehicles: Vehicle[] = [
  { id: 'v1', regNumber: 'VAN-01', name: 'Ford Transit 1', type: 'Van', maxLoadCapacity: 1000, odometer: 15000, acquisitionCost: 35000, status: 'Available' },
  { id: 'v2', regNumber: 'TRK-02', name: 'Volvo FH16', type: 'Truck', maxLoadCapacity: 18000, odometer: 120000, acquisitionCost: 150000, status: 'On Trip' },
  { id: 'v3', regNumber: 'VAN-03', name: 'Mercedes Sprinter', type: 'Van', maxLoadCapacity: 1200, odometer: 45000, acquisitionCost: 40000, status: 'In Shop' },
  { id: 'v4', regNumber: 'VAN-04', name: 'Ford Transit 2', type: 'Van', maxLoadCapacity: 1000, odometer: 200000, acquisitionCost: 32000, status: 'Retired' },
];

let mockMaintenance: MaintenanceRecord[] = [
  { id: 'm1', vehicleId: 'v3', vehicleName: 'Mercedes Sprinter', description: 'Routine oil change and brake pad replacement', status: 'Active', createdAt: new Date().toISOString() },
  { id: 'm2', vehicleId: 'v1', vehicleName: 'Ford Transit 1', description: 'Tire rotation', status: 'Closed', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), closedAt: new Date(Date.now() - 86400000 * 4).toISOString() },
];

let mockFuelLogs: FuelLog[] = [
  { id: 'f1', vehicleId: 'v1', vehicleName: 'Ford Transit 1', liters: 50, cost: 85.5, date: new Date().toISOString().split('T')[0] },
  { id: 'f2', vehicleId: 'v2', vehicleName: 'Volvo FH16', liters: 300, cost: 510.0, date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0] },
];

let mockExpenses: Expense[] = [
  { id: 'e1', vehicleId: 'v2', vehicleName: 'Volvo FH16', type: 'Toll', amount: 25.0, date: new Date().toISOString().split('T')[0] },
  { id: 'e2', vehicleId: 'v3', vehicleName: 'Mercedes Sprinter', type: 'Maintenance', amount: 450.0, date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0] },
];


export const maintenanceClient = {
  // Helpers
  getVehicles: async (): Promise<Vehicle[]> => {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 400));
      return [...mockVehicles];
    }
    const res = await fetch('/api/vehicles'); // Assuming Claude makes this
    if (!res.ok) throw new Error('Failed to fetch vehicles');
    return res.json();
  },

  // Maintenance API
  getMaintenanceRecords: async (vehicleId?: string): Promise<MaintenanceRecord[]> => {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 500));
      return vehicleId ? mockMaintenance.filter(m => m.vehicleId === vehicleId) : [...mockMaintenance];
    }
    const url = vehicleId ? `/api/maintenance?vehicleId=${vehicleId}` : '/api/maintenance';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch maintenance records');
    return res.json();
  },

  createMaintenance: async (vehicleId: string, description: string): Promise<MaintenanceRecord> => {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 600));
      const vehicle = mockVehicles.find(v => v.id === vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      
      const newRecord: MaintenanceRecord = {
        id: `m${Date.now()}`,
        vehicleId,
        vehicleName: vehicle.name,
        description,
        status: 'Active',
        createdAt: new Date().toISOString(),
      };
      mockMaintenance.unshift(newRecord);
      
      // Optimistic mock update
      vehicle.status = 'In Shop';
      
      return newRecord;
    }
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId, description }),
    });
    if (!res.ok) throw new Error('Failed to create maintenance record');
    return res.json();
  },

  closeMaintenance: async (id: string): Promise<MaintenanceRecord> => {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 600));
      const record = mockMaintenance.find(m => m.id === id);
      if (!record) throw new Error('Record not found');
      record.status = 'Closed';
      record.closedAt = new Date().toISOString();
      
      // Optimistic mock update
      const vehicle = mockVehicles.find(v => v.id === record.vehicleId);
      if (vehicle) vehicle.status = 'Available'; // Simple mock logic, might not account for Retired
      
      return record;
    }
    const res = await fetch(`/api/maintenance/${id}/close`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to close maintenance record');
    return res.json();
  },

  // Fuel Logs API
  getFuelLogs: async (vehicleId?: string): Promise<FuelLog[]> => {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 400));
      return vehicleId ? mockFuelLogs.filter(f => f.vehicleId === vehicleId) : [...mockFuelLogs];
    }
    const url = vehicleId ? `/api/fuel-logs?vehicleId=${vehicleId}` : '/api/fuel-logs';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch fuel logs');
    return res.json();
  },

  createFuelLog: async (vehicleId: string, liters: number, cost: number, date: string): Promise<FuelLog> => {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 500));
      const vehicle = mockVehicles.find(v => v.id === vehicleId);
      const newLog: FuelLog = {
        id: `f${Date.now()}`,
        vehicleId,
        vehicleName: vehicle?.name,
        liters,
        cost,
        date,
      };
      mockFuelLogs.unshift(newLog);
      return newLog;
    }
    const res = await fetch('/api/fuel-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId, liters, cost, date }),
    });
    if (!res.ok) throw new Error('Failed to log fuel');
    return res.json();
  },

  // Expenses API
  getExpenses: async (vehicleId?: string): Promise<Expense[]> => {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 400));
      return vehicleId ? mockExpenses.filter(e => e.vehicleId === vehicleId) : [...mockExpenses];
    }
    const url = vehicleId ? `/api/expenses?vehicleId=${vehicleId}` : '/api/expenses';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },

  createExpense: async (vehicleId: string, type: string, amount: number, description: string, date: string): Promise<Expense> => {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 500));
      const vehicle = mockVehicles.find(v => v.id === vehicleId);
      const newExpense: Expense = {
        id: `e${Date.now()}`,
        vehicleId,
        vehicleName: vehicle?.name,
        type,
        amount,
        date,
        description,
      };
      mockExpenses.unshift(newExpense);
      return newExpense;
    }
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId, type, amount, date, description }),
    });
    if (!res.ok) throw new Error('Failed to log expense');
    return res.json();
  },

  // Operational Cost API
  getOperationalCost: async (vehicleId: string): Promise<OperationalCost> => {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 600));
      const fuelCost = mockFuelLogs.filter(f => f.vehicleId === vehicleId).reduce((sum, f) => sum + f.cost, 0);
      const maintenanceCost = mockExpenses.filter(e => e.vehicleId === vehicleId && e.type === 'Maintenance').reduce((sum, e) => sum + e.amount, 0);
      return { fuelCost, maintenanceCost, totalCost: fuelCost + maintenanceCost };
    }
    const res = await fetch(`/api/vehicles/${vehicleId}/operational-cost`);
    if (!res.ok) throw new Error('Failed to fetch operational cost');
    return res.json();
  }
};
