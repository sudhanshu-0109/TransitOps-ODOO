const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const buildPagination = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

const getAll = async ({ page, limit, search, status, sort = 'createdAt', order = 'desc' }) => {
  const { skip, take } = buildPagination(page, limit);
  const where = {};
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { licenseNo: { contains: search, mode: 'insensitive' } },
    { phone: { contains: search, mode: 'insensitive' } },
  ];
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.driver.findMany({ where, skip, take, orderBy: { [sort]: order } }),
    prisma.driver.count({ where }),
  ]);
  return { data, total, page: parseInt(page) || 1, limit: take };
};

const getById = async (id) => {
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      trips: { orderBy: { createdAt: 'desc' }, take: 20, include: { vehicle: { select: { id: true, registrationNo: true, name: true } } } },
    },
  });
  if (!driver) throw new AppError('Driver not found.', 404, 'NOT_FOUND');
  return driver;
};

const create = async (data) => {
  return prisma.driver.create({ data });
};

const update = async (id, data) => {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw new AppError('Driver not found.', 404, 'NOT_FOUND');
  return prisma.driver.update({ where: { id }, data });
};

const updateStatus = async (id, status) => {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw new AppError('Driver not found.', 404, 'NOT_FOUND');
  if (driver.status === 'ON_TRIP' && status !== 'ON_TRIP') {
    throw new AppError('Cannot change status of a driver currently on a trip.', 422, 'DRIVER_ON_TRIP');
  }
  return prisma.driver.update({ where: { id }, data: { status } });
};

module.exports = { getAll, getById, create, update, updateStatus };
