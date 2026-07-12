const USE_MOCK = true;

// Types based on expected API responses
export interface DashboardKPIs {
  activeVehicles: number;
  availableVehicles: number;
  inMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilizationPct: number;
}

export interface FuelEfficiencyReport {
  vehicleId: string;
  vehicleName: string;
  distanceKm: number;
  litersUsed: number;
  efficiency: number; // km/l
}

export interface FleetUtilizationReport {
  vehicleId: string;
  vehicleName: string;
  utilizationPct: number;
  activeDays: number;
  idleDays: number;
}

export interface OperationalCostReport {
  vehicleId: string;
  vehicleName: string;
  fuelCost: number;
  maintenanceCost: number;
  totalCost: number;
}

export interface ROIReport {
  vehicleId: string;
  vehicleName: string;
  revenue: number;
  maintenanceCost: number;
  fuelCost: number;
  acquisitionCost: number;
  roi: number; // Percentage
}

// Mock Data Generators
const mockVehicles = [
  { id: "v1", name: "Volvo FH16 (TRK-001)" },
  { id: "v2", name: "Scania R500 (TRK-002)" },
  { id: "v3", name: "Mercedes Actros (TRK-003)" },
  { id: "v4", name: "MAN TGX (TRK-004)" },
  { id: "v5", name: "Volvo FH16 (TRK-005)" },
  { id: "v6", name: "Scania R500 (TRK-006)" },
  { id: "v7", name: "DAF XF (TRK-007)" },
  { id: "v8", name: "Mercedes Actros (TRK-008)" },
];

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const reportsClient = {
  async getDashboardKPIs(filters?: { type?: string; status?: string; region?: string }): Promise<DashboardKPIs> {
    if (USE_MOCK) {
      await delay(600); // Simulate network latency
      return {
        activeVehicles: 18,
        availableVehicles: 5,
        inMaintenance: 3,
        activeTrips: 15,
        pendingTrips: 8,
        driversOnDuty: 22,
        fleetUtilizationPct: 82.5,
      };
    }
    
    // Real implementation
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.region) params.append('region', filters.region);
    
    const res = await fetch(`/api/dashboard/kpis?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch KPIs");
    return res.json();
  },

  async getFuelEfficiency(filters?: { department?: string; dateFrom?: string; dateTo?: string }): Promise<FuelEfficiencyReport[]> {
    if (USE_MOCK) {
      await delay(700);
      return mockVehicles.map((v, i) => {
        const distanceKm = 3000 + (Math.random() * 2000) - (i * 100);
        const litersUsed = (distanceKm / 3.5) + (Math.random() * 50); // roughly 3.5 km/l
        return {
          vehicleId: v.id,
          vehicleName: v.name,
          distanceKm: Math.round(distanceKm),
          litersUsed: Math.round(litersUsed),
          efficiency: parseFloat((distanceKm / litersUsed).toFixed(2)),
        };
      }).sort((a, b) => b.efficiency - a.efficiency);
    }
    
    const params = new URLSearchParams();
    if (filters?.department) params.append('department', filters.department);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    
    const res = await fetch(`/api/reports/fuel-efficiency?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch fuel efficiency");
    return res.json();
  },

  async getFleetUtilization(filters?: { dateFrom?: string; dateTo?: string }): Promise<FleetUtilizationReport[]> {
    if (USE_MOCK) {
      await delay(750);
      return mockVehicles.map((v, i) => {
        // Assume a 30 day period
        const activeDays = 20 + Math.floor(Math.random() * 10) - (i % 3);
        const idleDays = 30 - activeDays;
        const utilizationPct = parseFloat(((activeDays / 30) * 100).toFixed(1));
        return {
          vehicleId: v.id,
          vehicleName: v.name,
          utilizationPct,
          activeDays,
          idleDays,
        };
      }).sort((a, b) => b.utilizationPct - a.utilizationPct);
    }
    
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    
    const res = await fetch(`/api/reports/fleet-utilization?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch fleet utilization");
    return res.json();
  },

  async getOperationalCost(filters?: { vehicleId?: string; dateFrom?: string; dateTo?: string }): Promise<OperationalCostReport[]> {
    if (USE_MOCK) {
      await delay(800);
      let vehicles = mockVehicles;
      if (filters?.vehicleId && filters.vehicleId !== 'all') {
        vehicles = vehicles.filter(v => v.id === filters.vehicleId);
      }
      
      return vehicles.map((v, i) => {
        const fuelCost = 2500 + Math.random() * 1000 + (i * 200);
        const maintenanceCost = i % 2 === 0 ? 0 : 800 + Math.random() * 1500;
        return {
          vehicleId: v.id,
          vehicleName: v.name,
          fuelCost: parseFloat(fuelCost.toFixed(2)),
          maintenanceCost: parseFloat(maintenanceCost.toFixed(2)),
          totalCost: parseFloat((fuelCost + maintenanceCost).toFixed(2)),
        };
      }).sort((a, b) => b.totalCost - a.totalCost);
    }
    
    const params = new URLSearchParams();
    if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    
    const res = await fetch(`/api/reports/operational-cost?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch operational costs");
    return res.json();
  },

  async getROI(filters?: { dateFrom?: string; dateTo?: string }): Promise<ROIReport[]> {
    if (USE_MOCK) {
      await delay(900);
      return mockVehicles.map((v, i) => {
        const acquisitionCost = 120000 + (i * 5000);
        const revenue = 15000 + Math.random() * 8000 - (i * 500);
        const fuelCost = 3000 + Math.random() * 1000;
        const maintenanceCost = i === 2 ? 4000 : Math.random() * 500;
        
        const netProfit = revenue - (fuelCost + maintenanceCost);
        // Simplified ROI for the period
        const roi = parseFloat(((netProfit / acquisitionCost) * 100).toFixed(2));
        
        return {
          vehicleId: v.id,
          vehicleName: v.name,
          revenue: parseFloat(revenue.toFixed(2)),
          maintenanceCost: parseFloat(maintenanceCost.toFixed(2)),
          fuelCost: parseFloat(fuelCost.toFixed(2)),
          acquisitionCost,
          roi,
        };
      }).sort((a, b) => b.roi - a.roi);
    }
    
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    
    const res = await fetch(`/api/reports/roi?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch ROI");
    return res.json();
  }
};
