const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const getAll = async ({ page = 1, limit = 20, vehicleId, status } = {}) => {
  const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
  const take = Math.min(100, parseInt(limit));
  const where = {};
  if (vehicleId) where.vehicleId = vehicleId;
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.maintenance.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: { vehicle: { select: { id: true, registrationNo: true, name: true } } },
    }),
    prisma.maintenance.count({ where }),
  ]);
  return { data, total };
};

const create = async (data) => {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) throw new AppError('Vehicle not found.', 404, 'NOT_FOUND');
    if (vehicle.status === 'RETIRED') throw new AppError('Cannot log maintenance for a retired vehicle.', 422, 'VEHICLE_RETIRED');
    if (vehicle.status === 'ON_TRIP') throw new AppError('Cannot log maintenance for a vehicle currently on a trip.', 422, 'VEHICLE_ON_TRIP');

    const [maintenance] = await Promise.all([
      tx.maintenance.create({ data: { ...data, status: 'ACTIVE' }, include: { vehicle: true } }),
      tx.vehicle.update({ where: { id: data.vehicleId }, data: { status: 'IN_SHOP' } }),
    ]);
    return maintenance;
  });
};

const close = async (id) => {
  return prisma.$transaction(async (tx) => {
    const record = await tx.maintenance.findUnique({ where: { id }, include: { vehicle: true } });
    if (!record) throw new AppError('Maintenance record not found.', 404, 'NOT_FOUND');
    if (record.status === 'CLOSED') throw new AppError('Maintenance record is already closed.', 422, 'ALREADY_CLOSED');

    const updates = [
      tx.maintenance.update({ where: { id }, data: { status: 'CLOSED', endDate: new Date() }, include: { vehicle: true } }),
    ];
    // Only restore to AVAILABLE if not RETIRED
    if (record.vehicle.status !== 'RETIRED') {
      updates.push(tx.vehicle.update({ where: { id: record.vehicleId }, data: { status: 'AVAILABLE' } }));
    }

    const [maintenance] = await Promise.all(updates);
    return maintenance;
  });
};

module.exports = { getAll, create, close };
