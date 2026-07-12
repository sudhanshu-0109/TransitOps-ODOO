const prisma = require('../config/prisma');

// ─── Fuel Logs ───────────────────────────────────────────────────────────────
const getAllFuel = async ({ page = 1, limit = 20, vehicleId, tripId } = {}) => {
  const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
  const take = Math.min(100, parseInt(limit));
  const where = {};
  if (vehicleId) where.vehicleId = vehicleId;
  if (tripId) where.tripId = tripId;

  const [data, total] = await Promise.all([
    prisma.fuelLog.findMany({
      where, skip, take, orderBy: { date: 'desc' },
      include: { vehicle: { select: { id: true, registrationNo: true, name: true } } },
    }),
    prisma.fuelLog.count({ where }),
  ]);
  return { data, total };
};

const createFuel = async (data) => {
  return prisma.fuelLog.create({
    data,
    include: { vehicle: { select: { id: true, registrationNo: true, name: true } } },
  });
};

// ─── Expenses ────────────────────────────────────────────────────────────────
const getAllExpenses = async ({ page = 1, limit = 20, vehicleId, tripId, expenseType } = {}) => {
  const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
  const take = Math.min(100, parseInt(limit));
  const where = {};
  if (vehicleId) where.vehicleId = vehicleId;
  if (tripId) where.tripId = tripId;
  if (expenseType) where.expenseType = expenseType;

  const [data, total] = await Promise.all([
    prisma.expense.findMany({
      where, skip, take, orderBy: { date: 'desc' },
      include: { vehicle: { select: { id: true, registrationNo: true, name: true } } },
    }),
    prisma.expense.count({ where }),
  ]);
  return { data, total };
};

const createExpense = async (data) => {
  return prisma.expense.create({
    data,
    include: { vehicle: { select: { id: true, registrationNo: true, name: true } } },
  });
};

// ─── Totals ───────────────────────────────────────────────────────────────────
const getTotals = async (vehicleId) => {
  const where = vehicleId ? { vehicleId } : {};
  const [fuelAgg, maintenanceAgg, expenseAgg] = await Promise.all([
    prisma.fuelLog.aggregate({ _sum: { cost: true }, where }),
    prisma.maintenance.aggregate({ _sum: { cost: true }, where }),
    prisma.expense.aggregate({ _sum: { amount: true }, where }),
  ]);
  const totalFuel = parseFloat(fuelAgg._sum.cost || 0);
  const totalMaintenance = parseFloat(maintenanceAgg._sum.cost || 0);
  const totalExpenses = parseFloat(expenseAgg._sum.amount || 0);
  return { totalFuel, totalMaintenance, totalExpenses, total: totalFuel + totalMaintenance + totalExpenses };
};

module.exports = { getAllFuel, createFuel, getAllExpenses, createExpense, getTotals };
