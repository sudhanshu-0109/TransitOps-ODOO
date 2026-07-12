const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const buildPagination = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

const getAll = async ({ page, limit, search, status, type, depotId, sort = 'createdAt', order = 'desc' }) => {
  const { skip, take } = buildPagination(page, limit);
  const where = {};
  if (search) where.OR = [
    { registrationNo: { contains: search, mode: 'insensitive' } },
    { name: { contains: search, mode: 'insensitive' } },
    { model: { contains: search, mode: 'insensitive' } },
  ];
  if (status) where.status = status;
  if (type) where.type = type;
  if (depotId) where.depotId = depotId;

  const [data, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take,
      orderBy: { [sort]: order },
      include: { depot: { select: { id: true, name: true, region: true } } },
    }),
    prisma.vehicle.count({ where }),
  ]);
  return { data, total, page: parseInt(page) || 1, limit: take };
};

const getById = async (id) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      depot: true,
      maintenances: { orderBy: { createdAt: 'desc' }, take: 20 },
      fuelLogs: { orderBy: { date: 'desc' }, take: 20 },
      expenses: { orderBy: { date: 'desc' }, take: 20 },
      trips: { orderBy: { createdAt: 'desc' }, take: 20, include: { driver: { select: { id: true, name: true } } } },
      documents: true,
    },
  });
  if (!vehicle) throw new AppError('Vehicle not found.', 404, 'NOT_FOUND');
  return vehicle;
};

const getTimeline = async (id) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new AppError('Vehicle not found.', 404, 'NOT_FOUND');

  const [maintenances, fuelLogs, expenses, trips] = await Promise.all([
    prisma.maintenance.findMany({ where: { vehicleId: id }, orderBy: { createdAt: 'desc' } }),
    prisma.fuelLog.findMany({ where: { vehicleId: id }, orderBy: { date: 'desc' } }),
    prisma.expense.findMany({ where: { vehicleId: id }, orderBy: { date: 'desc' } }),
    prisma.trip.findMany({ where: { vehicleId: id }, orderBy: { createdAt: 'desc' }, include: { driver: { select: { id: true, name: true } } } }),
  ]);

  const timeline = [
    ...maintenances.map((m) => ({ ...m, _type: 'MAINTENANCE' })),
    ...fuelLogs.map((f) => ({ ...f, _type: 'FUEL_LOG' })),
    ...expenses.map((e) => ({ ...e, _type: 'EXPENSE' })),
    ...trips.map((t) => ({ ...t, _type: 'TRIP' })),
  ].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  return timeline;
};

const create = async (data) => {
  return prisma.vehicle.create({ data, include: { depot: true } });
};

const update = async (id, data) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new AppError('Vehicle not found.', 404, 'NOT_FOUND');
  if (vehicle.status === 'RETIRED') throw new AppError('Cannot modify a retired vehicle.', 422, 'VEHICLE_RETIRED');
  return prisma.vehicle.update({ where: { id }, data, include: { depot: true } });
};

const retire = async (id) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new AppError('Vehicle not found.', 404, 'NOT_FOUND');
  if (vehicle.status === 'ON_TRIP') throw new AppError('Cannot retire a vehicle currently on a trip.', 422, 'VEHICLE_ON_TRIP');
  return prisma.vehicle.update({ where: { id }, data: { status: 'RETIRED' } });
};

const remove = async (id) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new AppError('Vehicle not found.', 404, 'NOT_FOUND');
  return prisma.vehicle.delete({ where: { id } });
};

module.exports = { getAll, getById, getTimeline, create, update, retire, remove };
