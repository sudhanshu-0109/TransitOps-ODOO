const { Router } = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

const router = Router();

/**
 * GET /api/v1/seed
 * Seeds the database with demo data.
 * Only works when NODE_ENV !== 'production' and no users exist yet.
 */
router.post('/', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, error: { message: 'Seeding disabled in production.' } });
    }

    // Check if already seeded
    const existingUser = await prisma.user.findFirst();
    if (existingUser) {
      return res.json({ success: true, message: 'Database already has data. No changes made.', seeded: false });
    }

    // Run seed inline
    const hash = (pw) => bcrypt.hashSync(pw, 10);

    // Roles
    const roles = await Promise.all([
      prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } }),
      prisma.role.upsert({ where: { name: 'FLEET_MANAGER' }, update: {}, create: { name: 'FLEET_MANAGER' } }),
      prisma.role.upsert({ where: { name: 'DISPATCHER' }, update: {}, create: { name: 'DISPATCHER' } }),
      prisma.role.upsert({ where: { name: 'SAFETY_OFFICER' }, update: {}, create: { name: 'SAFETY_OFFICER' } }),
      prisma.role.upsert({ where: { name: 'FINANCIAL_ANALYST' }, update: {}, create: { name: 'FINANCIAL_ANALYST' } }),
    ]);
    const roleMap = Object.fromEntries(roles.map((r) => [r.name, r]));

    // Depots
    const depot1 = await prisma.depot.upsert({ where: { id: 'depot-mumbai' }, update: {}, create: { id: 'depot-mumbai', name: 'Mumbai Central Depot', region: 'West' } });
    const depot2 = await prisma.depot.upsert({ where: { id: 'depot-delhi' }, update: {}, create: { id: 'depot-delhi', name: 'Delhi North Hub', region: 'North' } });

    // Users
    const usersData = [
      { email: 'admin@transitops.com', name: 'Alex Admin', roleId: roleMap.ADMIN.id, depotId: depot1.id },
      { email: 'fleet@transitops.com', name: 'Farhan Sheikh', roleId: roleMap.FLEET_MANAGER.id, depotId: depot1.id },
      { email: 'dispatch@transitops.com', name: 'Raven Kumar', roleId: roleMap.DISPATCHER.id, depotId: depot1.id },
      { email: 'safety@transitops.com', name: 'Sanya Mehta', roleId: roleMap.SAFETY_OFFICER.id, depotId: depot2.id },
      { email: 'finance@transitops.com', name: 'Vikram Nair', roleId: roleMap.FINANCIAL_ANALYST.id, depotId: depot2.id },
    ];
    for (const u of usersData) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { ...u, passwordHash: hash('password123'), isActive: true },
      });
    }

    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@transitops.com' } });

    // Vehicles
    const vehicleData = [
      { registrationNo: 'MH-01-AB-1001', name: 'VAN-05', model: 'Tata Ace', type: 'Van', capacityKg: 750, odometer: 45230, acquisitionCost: 850000, status: 'AVAILABLE', depotId: depot1.id },
      { registrationNo: 'MH-01-AB-1002', name: 'TRK-12', model: 'Ashok Leyland Boss', type: 'Truck', capacityKg: 7500, odometer: 128400, acquisitionCost: 3200000, status: 'AVAILABLE', depotId: depot1.id },
      { registrationNo: 'MH-01-AB-1003', name: 'MINI-08', model: 'Mahindra Bolero Pikup', type: 'Mini', capacityKg: 1200, odometer: 67800, acquisitionCost: 1150000, status: 'AVAILABLE', depotId: depot1.id },
      { registrationNo: 'DL-01-CD-2001', name: 'BUS-03', model: 'TATA Starbus', type: 'Bus', capacityKg: 5000, odometer: 234000, acquisitionCost: 4500000, status: 'AVAILABLE', depotId: depot2.id },
      { registrationNo: 'DL-01-CD-2002', name: 'TRK-07', model: 'Eicher Pro 2049', type: 'Truck', capacityKg: 4500, odometer: 98200, acquisitionCost: 2800000, status: 'IN_SHOP', depotId: depot2.id },
      { registrationNo: 'MH-02-EF-3001', name: 'VAN-11', model: 'Maruti Super Carry', type: 'Van', capacityKg: 600, odometer: 23400, acquisitionCost: 720000, status: 'AVAILABLE', depotId: depot1.id },
    ];
    const vehicles = [];
    for (const v of vehicleData) {
      const vehicle = await prisma.vehicle.upsert({ where: { registrationNo: v.registrationNo }, update: {}, create: v });
      vehicles.push(vehicle);
    }

    // Drivers
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const driverData = [
      { name: 'Alex Rodrigues', licenseNo: 'MH20240001', category: 'HMV', licenseExpiry: nextYear, phone: '9876543001', safetyScore: 95, status: 'AVAILABLE' },
      { name: 'John Mathew', licenseNo: 'MH20240002', category: 'HMV', licenseExpiry: nextYear, phone: '9876543002', safetyScore: 88, status: 'AVAILABLE' },
      { name: 'Priya Sharma', licenseNo: 'DL20240003', category: 'LMV', licenseExpiry: nextYear, phone: '9876543003', safetyScore: 92, status: 'AVAILABLE' },
      { name: 'Ramesh Gupta', licenseNo: 'MH20240004', category: 'HMV', licenseExpiry: in30Days, phone: '9876543004', safetyScore: 78, status: 'AVAILABLE' },
      { name: 'Meena Patil', licenseNo: 'DL20240007', category: 'LMV', licenseExpiry: nextYear, phone: '9876543007', safetyScore: 90, status: 'AVAILABLE' },
    ];
    const drivers = [];
    for (const d of driverData) {
      const driver = await prisma.driver.upsert({ where: { licenseNo: d.licenseNo }, update: {}, create: d });
      drivers.push(driver);
    }

    // Trips
    await prisma.trip.upsert({ where: { tripNo: 'TR001' }, update: {}, create: { tripNo: 'TR001', source: 'Mumbai', destination: 'Pune', cargoWeightKg: 800, plannedDistanceKm: 150, status: 'DRAFT', revenue: 0, createdBy: adminUser.id } });
    await prisma.trip.upsert({ where: { tripNo: 'TR002' }, update: {}, create: { tripNo: 'TR002', vehicleId: vehicles[1].id, driverId: drivers[1].id, source: 'Delhi', destination: 'Jaipur', cargoWeightKg: 5000, plannedDistanceKm: 280, actualDistanceKm: 284, startOdometer: 128100, endOdometer: 128384, status: 'COMPLETED', dispatchedAt: new Date(Date.now() - 86400000 * 2), completedAt: new Date(Date.now() - 86400000), revenue: 45000, fuelUsedLiters: 48, createdBy: adminUser.id } });

    // Maintenance
    await prisma.maintenance.create({ data: { vehicleId: vehicles[4].id, title: 'Engine Overhaul', type: 'Engine Repair', cost: 85000, status: 'ACTIVE', startDate: new Date(Date.now() - 86400000 * 3), technician: 'Ajay Motors' } }).catch(() => {});

    // Fuel logs
    await prisma.fuelLog.create({ data: { vehicleId: vehicles[0].id, liters: 45, cost: 4500, date: new Date(), fuelStation: 'HP Petrol, Andheri' } }).catch(() => {});

    // Expenses
    await prisma.expense.create({ data: { vehicleId: vehicles[0].id, expenseType: 'TOLL', amount: 850, date: new Date(), description: 'Mumbai-Pune Expressway toll' } }).catch(() => {});

    // Notifications
    const notificationItems = [
      { type: 'LICENSE_EXPIRY', message: "Driver Ramesh Gupta's license expires in 30 days.", isRead: false },
      { type: 'MAINTENANCE_DUE', message: 'TRK-07 has an active maintenance record — currently IN SHOP.', isRead: false },
    ];
    for (const n of notificationItems) {
      await prisma.notification.create({ data: n });
    }

    res.json({
      success: true,
      message: 'Database seeded successfully!',
      seeded: true,
      credentials: {
        password: 'password123',
        accounts: usersData.map((u) => ({ email: u.email })),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
