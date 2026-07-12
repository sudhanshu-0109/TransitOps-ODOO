const prisma = require('../config/prisma');

const getDashboard = async () => {
  const [
    totalVehicles,
    availableVehicles,
    onTripVehicles,
    inShopVehicles,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    recentTrips,
    upcomingMaintenance,
    expiringLicenses,
    recentExpenses,
    vehicleStatusCounts,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { status: { not: 'RETIRED' } } }),
    prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
    prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
    prisma.vehicle.count({ where: { status: 'IN_SHOP' } }),
    prisma.vehicle.count({ where: { status: 'RETIRED' } }),
    prisma.trip.count({ where: { status: 'DISPATCHED' } }),
    prisma.trip.count({ where: { status: 'DRAFT' } }),
    prisma.driver.count({ where: { status: { in: ['ON_TRIP', 'AVAILABLE'] } } }),
    prisma.trip.findMany({
      take: 8,
      orderBy: { updatedAt: 'desc' },
      include: {
        vehicle: { select: { registrationNo: true } },
        driver: { select: { name: true } },
      },
    }),
    prisma.maintenance.findMany({
      where: { status: 'ACTIVE' },
      take: 5,
      orderBy: { startDate: 'asc' },
      include: { vehicle: { select: { registrationNo: true, name: true } } },
    }),
    prisma.driver.findMany({
      where: { licenseExpiry: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
      take: 5,
      orderBy: { licenseExpiry: 'asc' },
      select: { id: true, name: true, licenseNo: true, licenseExpiry: true },
    }),
    prisma.expense.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { vehicle: { select: { registrationNo: true } } },
    }),
    prisma.vehicle.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const fleetUtilization = totalVehicles > 0
    ? Math.round((onTripVehicles / totalVehicles) * 100)
    : 0;

  return {
    kpis: {
      activeVehicles: totalVehicles,
      availableVehicles,
      vehiclesInMaintenance: inShopVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
    },
    recentTrips,
    upcomingMaintenance,
    expiringLicenses,
    recentExpenses,
    vehicleStatus: vehicleStatusCounts.map((v) => ({ status: v.status, count: v._count._all })),
  };
};

module.exports = { getDashboard };
