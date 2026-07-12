import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Demo fleet mirrors the mock data in lib/api/maintenanceClient.ts so flipping
// USE_MOCK_API to false yields the same starting state the UI was designed
// against. Vehicle ids are pinned (v1..v4) for deterministic demos.
const DAY = 86_400_000;

async function main() {
  // Idempotent-ish reset for repeatable seeding in a hackathon setting.
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();

  await prisma.vehicle.createMany({
    data: [
      { id: "v1", regNumber: "VAN-01", name: "Ford Transit 1", type: "Van", maxLoadCapacity: 1000, odometer: 15000, acquisitionCost: 35000, status: "Available" },
      { id: "v2", regNumber: "TRK-02", name: "Volvo FH16", type: "Truck", maxLoadCapacity: 18000, odometer: 120000, acquisitionCost: 150000, status: "On Trip" },
      { id: "v3", regNumber: "VAN-03", name: "Mercedes Sprinter", type: "Van", maxLoadCapacity: 1200, odometer: 45000, acquisitionCost: 40000, status: "In Shop" },
      { id: "v4", regNumber: "VAN-04", name: "Ford Transit 2", type: "Van", maxLoadCapacity: 1000, odometer: 200000, acquisitionCost: 32000, status: "Retired" },
    ],
  });

  const driver = await prisma.driver.create({
    data: {
      id: "d1",
      name: "Sam Rivera",
      licenseNumber: "DL-0001",
      licenseCategory: "C",
      licenseExpiry: new Date(Date.now() + DAY * 365),
      safetyScore: 92,
      status: "Available",
    },
  });

  // Completed trips give getFuelEfficiency() a non-zero distance to divide by.
  await prisma.trip.createMany({
    data: [
      { id: "t1", vehicleId: "v1", driverId: driver.id, status: "Completed", distance: 620, completedAt: new Date(Date.now() - DAY * 3) },
      { id: "t2", vehicleId: "v2", driverId: driver.id, status: "Completed", distance: 1500, completedAt: new Date(Date.now() - DAY * 1) },
      { id: "t3", vehicleId: "v2", driverId: driver.id, status: "Dispatched", distance: 0 },
    ],
  });

  await prisma.maintenanceLog.createMany({
    data: [
      { id: "m1", vehicleId: "v3", description: "Routine oil change and brake pad replacement", status: "Active" },
      { id: "m2", vehicleId: "v1", description: "Tire rotation", status: "Closed", createdAt: new Date(Date.now() - DAY * 5), closedAt: new Date(Date.now() - DAY * 4) },
    ],
  });

  await prisma.fuelLog.createMany({
    data: [
      { vehicleId: "v1", liters: 50, cost: 85.5, date: new Date() },
      { vehicleId: "v2", liters: 300, cost: 510.0, date: new Date(Date.now() - DAY * 2) },
    ],
  });

  await prisma.expense.createMany({
    data: [
      { vehicleId: "v2", type: "Toll", amount: 25.0, date: new Date() },
      { vehicleId: "v3", type: "Maintenance", amount: 450.0, date: new Date(Date.now() - DAY * 1) },
    ],
  });

  console.log("Seed complete: 4 vehicles, 1 driver, 3 trips, 2 maintenance logs, 2 fuel logs, 2 expenses.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
