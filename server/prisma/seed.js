const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TransitOps database...');

  // ─── Roles ──────────────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } }),
    prisma.role.upsert({ where: { name: 'FLEET_MANAGER' }, update: {}, create: { name: 'FLEET_MANAGER' } }),
    prisma.role.upsert({ where: { name: 'DISPATCHER' }, update: {}, create: { name: 'DISPATCHER' } }),
    prisma.role.upsert({ where: { name: 'SAFETY_OFFICER' }, update: {}, create: { name: 'SAFETY_OFFICER' } }),
    prisma.role.upsert({ where: { name: 'FINANCIAL_ANALYST' }, update: {}, create: { name: 'FINANCIAL_ANALYST' } }),
  ]);
  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r]));
  console.log('✅ Roles seeded');

  // ─── Depots ─────────────────────────────────────────────────────────────────
  const depot1 = await prisma.depot.upsert({ where: { id: 'depot-mumbai' }, update: {}, create: { id: 'depot-mumbai', name: 'Mumbai Central Depot', region: 'West' } });
  const depot2 = await prisma.depot.upsert({ where: { id: 'depot-delhi' }, update: {}, create: { id: 'depot-delhi', name: 'Delhi North Hub', region: 'North' } });
  console.log('✅ Depots seeded');

  // ─── Users ──────────────────────────────────────────────────────────────────
  const hash = (pw) => bcrypt.hashSync(pw, 10);
  const users = [
    { email: 'admin@transitops.com', name: 'Alex Admin', roleId: roleMap.ADMIN.id, depotId: depot1.id },
    { email: 'fleet@transitops.com', name: 'Farhan Sheikh', roleId: roleMap.FLEET_MANAGER.id, depotId: depot1.id },
    { email: 'dispatch@transitops.com', name: 'Raven Kumar', roleId: roleMap.DISPATCHER.id, depotId: depot1.id },
    { email: 'safety@transitops.com', name: 'Sanya Mehta', roleId: roleMap.SAFETY_OFFICER.id, depotId: depot2.id },
    { email: 'finance@transitops.com', name: 'Vikram Nair', roleId: roleMap.FINANCIAL_ANALYST.id, depotId: depot2.id },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: hash('password123'), isActive: true },
    });
  }
  console.log('✅ Users seeded (password: password123)');

  // ─── Vehicles ───────────────────────────────────────────────────────────────
  const vehicleData = [
    { registrationNo: 'MH-01-AB-1001', name: 'VAN-05', model: 'Tata Ace', type: 'Van', capacityKg: 750, odometer: 45230, acquisitionCost: 850000, status: 'AVAILABLE', depotId: depot1.id },
    { registrationNo: 'MH-01-AB-1002', name: 'TRK-12', model: 'Ashok Leyland Boss', type: 'Truck', capacityKg: 7500, odometer: 128400, acquisitionCost: 3200000, status: 'AVAILABLE', depotId: depot1.id },
    { registrationNo: 'MH-01-AB-1003', name: 'MINI-08', model: 'Mahindra Bolero Pikup', type: 'Mini', capacityKg: 1200, odometer: 67800, acquisitionCost: 1150000, status: 'ON_TRIP', depotId: depot1.id },
    { registrationNo: 'DL-01-CD-2001', name: 'BUS-03', model: 'TATA Starbus', type: 'Bus', capacityKg: 5000, odometer: 234000, acquisitionCost: 4500000, status: 'AVAILABLE', depotId: depot2.id },
    { registrationNo: 'DL-01-CD-2002', name: 'TRK-07', model: 'Eicher Pro 2049', type: 'Truck', capacityKg: 4500, odometer: 98200, acquisitionCost: 2800000, status: 'IN_SHOP', depotId: depot2.id },
    { registrationNo: 'MH-02-EF-3001', name: 'VAN-11', model: 'Maruti Super Carry', type: 'Van', capacityKg: 600, odometer: 23400, acquisitionCost: 720000, status: 'AVAILABLE', depotId: depot1.id },
    { registrationNo: 'MH-02-EF-3002', name: 'TRK-15', model: 'BharatBenz 914R', type: 'Truck', capacityKg: 9000, odometer: 310000, acquisitionCost: 5100000, status: 'RETIRED', depotId: depot1.id },
    { registrationNo: 'DL-02-GH-4001', name: 'MINI-02', model: 'Tata Intra V30', type: 'Mini', capacityKg: 1500, odometer: 54300, acquisitionCost: 1350000, status: 'AVAILABLE', depotId: depot2.id },
    { registrationNo: 'MH-03-IJ-5001', name: 'VAN-09', model: 'Piaggio Ape FX', type: 'Van', capacityKg: 500, odometer: 18700, acquisitionCost: 580000, status: 'AVAILABLE', depotId: depot1.id },
    { registrationNo: 'DL-03-KL-6001', name: 'TRK-21', model: 'Volvo FM 440', type: 'Truck', capacityKg: 25000, odometer: 445000, acquisitionCost: 12000000, status: 'AVAILABLE', depotId: depot2.id },
  ];

  const vehicles = [];
  for (const v of vehicleData) {
    const vehicle = await prisma.vehicle.upsert({
      where: { registrationNo: v.registrationNo },
      update: {},
      create: v,
    });
    vehicles.push(vehicle);
  }
  console.log('✅ Vehicles seeded');

  // ─── Drivers ────────────────────────────────────────────────────────────────
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const in5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const expired = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const driverData = [
    { name: 'Alex Rodrigues', licenseNo: 'MH20240001', category: 'HMV', licenseExpiry: nextYear, phone: '9876543001', email: 'alex.r@driver.com', safetyScore: 95, status: 'AVAILABLE' },
    { name: 'John Mathew', licenseNo: 'MH20240002', category: 'HMV', licenseExpiry: nextYear, phone: '9876543002', email: 'john.m@driver.com', safetyScore: 88, status: 'AVAILABLE' },
    { name: 'Priya Sharma', licenseNo: 'DL20240003', category: 'LMV', licenseExpiry: nextYear, phone: '9876543003', email: 'priya.s@driver.com', safetyScore: 92, status: 'ON_TRIP' },
    { name: 'Ramesh Gupta', licenseNo: 'MH20240004', category: 'HMV', licenseExpiry: in30Days, phone: '9876543004', safetyScore: 78, status: 'AVAILABLE' },
    { name: 'Sunita Devi', licenseNo: 'DL20240005', category: 'LMV', licenseExpiry: in5Days, phone: '9876543005', safetyScore: 85, status: 'AVAILABLE' },
    { name: 'Karan Singh', licenseNo: 'MH20240006', category: 'HMV', licenseExpiry: expired, phone: '9876543006', safetyScore: 70, status: 'OFF_DUTY' },
    { name: 'Meena Patil', licenseNo: 'DL20240007', category: 'LMV', licenseExpiry: nextYear, phone: '9876543007', safetyScore: 90, status: 'AVAILABLE' },
    { name: 'Arjun Nair', licenseNo: 'MH20240008', category: 'HMV', licenseExpiry: nextYear, phone: '9876543008', safetyScore: 82, status: 'SUSPENDED' },
    { name: 'Deepa Rao', licenseNo: 'DL20240009', category: 'LMV', licenseExpiry: nextYear, phone: '9876543009', safetyScore: 96, status: 'AVAILABLE' },
    { name: 'Vijay Kumar', licenseNo: 'MH20240010', category: 'HMV', licenseExpiry: nextYear, phone: '9876543010', safetyScore: 88, status: 'AVAILABLE' },
  ];

  const drivers = [];
  for (const d of driverData) {
    const driver = await prisma.driver.upsert({
      where: { licenseNo: d.licenseNo },
      update: {},
      create: d,
    });
    drivers.push(driver);
  }
  console.log('✅ Drivers seeded');

  // ─── Trips ──────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@transitops.com' } });
  const tripData = [
    { tripNo: 'TR001', vehicleId: vehicles[2].id, driverId: drivers[2].id, source: 'Mumbai', destination: 'Pune', cargoWeightKg: 800, plannedDistanceKm: 150, status: 'DISPATCHED', dispatchedAt: new Date(), startOdometer: 67800, revenue: 18000 },
    { tripNo: 'TR002', vehicleId: vehicles[1].id, driverId: drivers[1].id, source: 'Delhi', destination: 'Jaipur', cargoWeightKg: 5000, plannedDistanceKm: 280, actualDistanceKm: 284, startOdometer: 128100, endOdometer: 128384, status: 'COMPLETED', dispatchedAt: new Date(Date.now() - 86400000 * 2), completedAt: new Date(Date.now() - 86400000), revenue: 45000, fuelUsedLiters: 48 },
    { tripNo: 'TR003', vehicleId: vehicles[0].id, driverId: drivers[0].id, source: 'Mumbai', destination: 'Nashik', cargoWeightKg: 500, plannedDistanceKm: 170, actualDistanceKm: 168, startOdometer: 45060, endOdometer: 45228, status: 'COMPLETED', dispatchedAt: new Date(Date.now() - 86400000 * 3), completedAt: new Date(Date.now() - 86400000 * 2), revenue: 22000, fuelUsedLiters: 22 },
    { tripNo: 'TR004', source: 'Bangalore', destination: 'Chennai', cargoWeightKg: 2000, plannedDistanceKm: 350, status: 'DRAFT', revenue: 0 },
    { tripNo: 'TR005', vehicleId: vehicles[3].id, driverId: drivers[6].id, source: 'Delhi', destination: 'Agra', cargoWeightKg: 3000, plannedDistanceKm: 210, status: 'DISPATCHED', dispatchedAt: new Date(), startOdometer: 234000, revenue: 35000 },
    { tripNo: 'TR006', source: 'Hyderabad', destination: 'Vijayawada', cargoWeightKg: 1500, plannedDistanceKm: 275, status: 'DRAFT', revenue: 0 },
    { tripNo: 'TR007', vehicleId: vehicles[7].id, driverId: drivers[8].id, source: 'Mumbai', destination: 'Surat', cargoWeightKg: 900, plannedDistanceKm: 265, actualDistanceKm: 269, startOdometer: 54030, endOdometer: 54299, status: 'COMPLETED', dispatchedAt: new Date(Date.now() - 86400000 * 5), completedAt: new Date(Date.now() - 86400000 * 4), revenue: 32000, fuelUsedLiters: 35 },
    { tripNo: 'TR008', vehicleId: vehicles[9].id, driverId: drivers[9].id, source: 'Delhi', destination: 'Chandigarh', cargoWeightKg: 18000, plannedDistanceKm: 245, status: 'CANCELLED', cancelReason: 'Vehicle went to shop for repairs', cancelledAt: new Date(Date.now() - 86400000), revenue: 0 },
  ];

  for (const t of tripData) {
    await prisma.trip.upsert({
      where: { tripNo: t.tripNo },
      update: {},
      create: { ...t, createdBy: adminUser.id },
    });
  }
  console.log('✅ Trips seeded');

  // ─── Maintenance ────────────────────────────────────────────────────────────
  const maintenanceData = [
    { vehicleId: vehicles[4].id, title: 'Engine Overhaul', type: 'Engine Repair', cost: 85000, status: 'ACTIVE', startDate: new Date(Date.now() - 86400000 * 3), technician: 'Ajay Motors', notes: 'Piston replacement and coolant flush' },
    { vehicleId: vehicles[1].id, title: 'Oil Change & Filter', type: 'Oil Change', cost: 4500, status: 'CLOSED', startDate: new Date(Date.now() - 86400000 * 10), endDate: new Date(Date.now() - 86400000 * 9), technician: 'Quick Service', notes: 'Regular 10k km service' },
    { vehicleId: vehicles[0].id, title: 'Brake Pad Replacement', type: 'Brake Service', cost: 8000, status: 'CLOSED', startDate: new Date(Date.now() - 86400000 * 20), endDate: new Date(Date.now() - 86400000 * 19), technician: 'Rajesh Auto' },
    { vehicleId: vehicles[5].id, title: 'Tyre Replacement - All 4', type: 'Tyre Replace', cost: 22000, status: 'CLOSED', startDate: new Date(Date.now() - 86400000 * 7), endDate: new Date(Date.now() - 86400000 * 6), technician: 'MRF Tyres', notes: 'All 4 tyres replaced, balancing done' },
    { vehicleId: vehicles[3].id, title: 'AC Compressor Service', type: 'AC Service', cost: 12000, status: 'CLOSED', startDate: new Date(Date.now() - 86400000 * 30), endDate: new Date(Date.now() - 86400000 * 28), technician: 'Cool Fix', notes: 'Refrigerant refilled' },
  ];

  for (const m of maintenanceData) {
    await prisma.maintenance.create({ data: m }).catch(() => {}); // ignore duplicates on re-seed
  }
  console.log('✅ Maintenance seeded');

  // ─── Fuel Logs ──────────────────────────────────────────────────────────────
  const fuelData = [
    { vehicleId: vehicles[0].id, liters: 45, cost: 4500, date: new Date(Date.now() - 86400000 * 2), fuelStation: 'HP Petrol, Andheri' },
    { vehicleId: vehicles[1].id, liters: 120, cost: 11400, date: new Date(Date.now() - 86400000 * 5), fuelStation: 'BPCL, Thane' },
    { vehicleId: vehicles[2].id, liters: 38, cost: 3610, date: new Date(Date.now() - 86400000 * 1), fuelStation: 'Indian Oil, Dadar' },
    { vehicleId: vehicles[3].id, liters: 85, cost: 8075, date: new Date(Date.now() - 86400000 * 3), fuelStation: 'HPCL, Connaught Place' },
    { vehicleId: vehicles[7].id, liters: 52, cost: 4940, date: new Date(Date.now() - 86400000 * 6), fuelStation: 'HP Petrol, Navi Mumbai' },
    { vehicleId: vehicles[0].id, liters: 40, cost: 3800, date: new Date(Date.now() - 86400000 * 12), fuelStation: 'IndianOil, Bandra' },
    { vehicleId: vehicles[9].id, liters: 180, cost: 17100, date: new Date(Date.now() - 86400000 * 8), fuelStation: 'Shell, Gurugram' },
  ];

  for (const f of fuelData) {
    await prisma.fuelLog.create({ data: f }).catch(() => {});
  }
  console.log('✅ Fuel logs seeded');

  // ─── Expenses ───────────────────────────────────────────────────────────────
  const expenseData = [
    { vehicleId: vehicles[0].id, expenseType: 'TOLL', amount: 850, date: new Date(Date.now() - 86400000 * 2), description: 'Mumbai-Pune Expressway toll' },
    { vehicleId: vehicles[1].id, expenseType: 'INSURANCE', amount: 45000, date: new Date(Date.now() - 86400000 * 30), description: 'Annual insurance renewal' },
    { vehicleId: vehicles[2].id, expenseType: 'PARKING', amount: 500, date: new Date(Date.now() - 86400000 * 1), description: 'APMC yard parking' },
    { vehicleId: vehicles[3].id, expenseType: 'TOLL', amount: 1200, date: new Date(Date.now() - 86400000 * 3), description: 'Delhi-Agra highway toll' },
    { vehicleId: vehicles[5].id, expenseType: 'MISC', amount: 3500, date: new Date(Date.now() - 86400000 * 7), description: 'Driver accommodation - overnight trip' },
  ];

  for (const e of expenseData) {
    await prisma.expense.create({ data: e }).catch(() => {});
  }
  console.log('✅ Expenses seeded');

  // ─── Notifications ──────────────────────────────────────────────────────────
  const notificationItems = [
    { type: 'LICENSE_EXPIRY', message: "Driver Sunita Devi's license expires in 5 days.", isRead: false },
    { type: 'LICENSE_EXPIRY', message: "Driver Ramesh Gupta's license expires in 30 days.", isRead: false },
    { type: 'MAINTENANCE_DUE', message: 'TRK-07 (DL-01-CD-2002) has an active maintenance record — currently IN SHOP.', isRead: false },
    { type: 'TRIP_COMPLETED', message: 'Trip TR003 (Mumbai → Nashik) completed successfully.', isRead: true },
  ];
  for (const n of notificationItems) {
    await prisma.notification.create({ data: n });
  }
  console.log('✅ Notifications seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin:            admin@transitops.com     / password123');
  console.log('   Fleet Manager:    fleet@transitops.com     / password123');
  console.log('   Dispatcher:       dispatch@transitops.com  / password123');
  console.log('   Safety Officer:   safety@transitops.com    / password123');
  console.log('   Financial Analyst:finance@transitops.com   / password123');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
