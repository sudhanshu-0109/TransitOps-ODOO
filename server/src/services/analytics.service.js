const prisma = require('../config/prisma');

const getAnalytics = async ({ months = 6 } = {}) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months));

  const [
    completedTrips,
    fuelAgg,
    maintenanceAgg,
    expenseAgg,
    topCostlyVehicles,
    expenseBreakdownRaw,
    maintenanceRaw,
    totalVehicles,
    onTripVehicles,
  ] = await Promise.all([
    // Completed trips in period for revenue + fuel efficiency
    prisma.trip.findMany({
      where: { status: 'COMPLETED', completedAt: { gte: startDate } },
      select: { completedAt: true, revenue: true, actualDistanceKm: true, fuelUsedLiters: true },
    }),
    // Total fuel cost
    prisma.fuelLog.aggregate({ _sum: { cost: true, liters: true } }),
    // Total maintenance cost
    prisma.maintenance.aggregate({ _sum: { cost: true } }),
    // Total other expenses
    prisma.expense.aggregate({ _sum: { amount: true } }),
    // Top costly vehicles (by sum of all costs)
    prisma.vehicle.findMany({
      take: 8,
      select: {
        id: true,
        registrationNo: true,
        name: true,
        acquisitionCost: true,
        fuelLogs: { select: { cost: true } },
        maintenances: { select: { cost: true } },
        expenses: { select: { amount: true } },
        trips: { where: { status: 'COMPLETED' }, select: { revenue: true } },
      },
    }),
    // Expense breakdown by type
    prisma.expense.groupBy({
      by: ['expenseType'],
      _sum: { amount: true },
    }),
    // Maintenance events in period
    prisma.maintenance.findMany({
      where: { startDate: { gte: startDate } },
      select: { startDate: true },
    }),
    // Fleet counts
    prisma.vehicle.count({ where: { status: { not: 'RETIRED' } } }),
    prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
  ]);

  // ── Monthly revenue grouping ─────────────────────────────────────────────
  const monthlyMap = {};
  completedTrips.forEach((trip) => {
    const key = new Date(trip.completedAt).toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, revenue: 0, trips: 0 };
    monthlyMap[key].revenue += parseFloat(trip.revenue || 0);
    monthlyMap[key].trips += 1;
  });

  // ── Maintenance by month ────────────────────────────────────────────────
  const maintenanceMap = {};
  maintenanceRaw.forEach((m) => {
    const key = new Date(m.startDate).toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!maintenanceMap[key]) maintenanceMap[key] = { month: key, count: 0 };
    maintenanceMap[key].count += 1;
  });

  // ── Expense breakdown ───────────────────────────────────────────────────
  const expenseBreakdown = expenseBreakdownRaw.map((e) => ({
    expenseType: e.expenseType,
    total: parseFloat(e._sum.amount || 0),
  }));

  // ── Costliest vehicles ───────────────────────────────────────────────────
  const enrichedVehicles = topCostlyVehicles.map((v) => {
    const fuel = v.fuelLogs.reduce((s, f) => s + parseFloat(f.cost), 0);
    const maintenance = v.maintenances.reduce((s, m) => s + parseFloat(m.cost), 0);
    const expenses = v.expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const revenue = v.trips.reduce((s, t) => s + parseFloat(t.revenue || 0), 0);
    const totalCost = fuel + maintenance + expenses;
    const acq = parseFloat(v.acquisitionCost);
    const roi = acq > 0 ? ((revenue - totalCost) / acq * 100).toFixed(1) : '0';
    return { id: v.id, registrationNo: v.registrationNo, name: v.name, fuel, maintenance, expenses, totalCost, revenue, roi: parseFloat(roi) };
  }).sort((a, b) => b.totalCost - a.totalCost);

  // ── Aggregated totals ───────────────────────────────────────────────────
  const totalFuel = parseFloat(fuelAgg._sum.cost || 0);
  const totalMaintenance = parseFloat(maintenanceAgg._sum.cost || 0);
  const totalExpenses = parseFloat(expenseAgg._sum.amount || 0);
  const totalOperationalCost = totalFuel + totalMaintenance + totalExpenses;

  // ── Fleet utilization ───────────────────────────────────────────────────
  const fleetUtilization = totalVehicles > 0
    ? Math.round((onTripVehicles / totalVehicles) * 100)
    : 0;

  // ── Fuel efficiency ─────────────────────────────────────────────────────
  const tripsWithFuel = completedTrips.filter(
    (t) => t.actualDistanceKm && t.fuelUsedLiters && parseFloat(t.fuelUsedLiters) > 0
  );
  const fuelEfficiency = tripsWithFuel.length > 0
    ? parseFloat(
        (tripsWithFuel.reduce(
          (s, t) => s + parseFloat(t.actualDistanceKm) / parseFloat(t.fuelUsedLiters),
          0
        ) / tripsWithFuel.length).toFixed(2)
      )
    : 0;

  // ── Average ROI ─────────────────────────────────────────────────────────
  const vehiclesWithRoi = enrichedVehicles.filter((v) => parseFloat(v.acquisitionCost || 0) > 0);
  const avgRoi = vehiclesWithRoi.length > 0
    ? parseFloat(
        (vehiclesWithRoi.reduce((s, v) => s + v.roi, 0) / vehiclesWithRoi.length).toFixed(1)
      )
    : 0;

  return {
    // KPIs (flat — what the AnalyticsPage expects)
    fuelEfficiency,
    fleetUtilization,
    totalOperationalCost,
    totalFuel,
    totalMaintenance,
    totalExpenses,
    avgRoi,
    // Charts
    monthlyRevenue: Object.values(monthlyMap),
    costliestVehicles: enrichedVehicles,
    maintenanceByMonth: Object.values(maintenanceMap),
    expenseBreakdown,
  };
};

module.exports = { getAnalytics };
