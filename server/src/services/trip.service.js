const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

let tripCounter = 1000;

const generateTripNo = async () => {
  const last = await prisma.trip.findFirst({ orderBy: { tripNo: 'desc' } });
  if (last && last.tripNo) {
    const num = parseInt(last.tripNo.replace('TR', '')) + 1;
    return `TR${String(num).padStart(3, '0')}`;
  }
  return 'TR001';
};

const buildPagination = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  return { skip: (p - 1) * l, take: l };
};

const getAll = async ({ page, limit, status, vehicleId, driverId, search, sort = 'createdAt', order = 'desc' }) => {
  const { skip, take } = buildPagination(page, limit);
  const where = {};
  if (status) where.status = status;
  if (vehicleId) where.vehicleId = vehicleId;
  if (driverId) where.driverId = driverId;
  if (search) where.OR = [
    { tripNo: { contains: search, mode: 'insensitive' } },
    { source: { contains: search, mode: 'insensitive' } },
    { destination: { contains: search, mode: 'insensitive' } },
  ];

  const [data, total] = await Promise.all([
    prisma.trip.findMany({
      where, skip, take, orderBy: { [sort]: order },
      include: {
        vehicle: { select: { id: true, registrationNo: true, name: true } },
        driver: { select: { id: true, name: true } },
      },
    }),
    prisma.trip.count({ where }),
  ]);
  return { data, total, page: parseInt(page) || 1, limit: take };
};

const getById = async (id) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: true,
      fuelLogs: true,
      expenses: true,
    },
  });
  if (!trip) throw new AppError('Trip not found.', 404, 'NOT_FOUND');
  return trip;
};

const create = async (data, userId) => {
  const tripNo = await generateTripNo();
  return prisma.trip.create({
    data: { ...data, tripNo, createdBy: userId, status: 'DRAFT' },
    include: { vehicle: true, driver: true },
  });
};

/**
 * DISPATCH — enforces all §9 business rules in a single transaction.
 */
const dispatch = async (tripId, { vehicleId, driverId }, userId) => {
  return prisma.$transaction(async (tx) => {
    // Lock trip row
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new AppError('Trip not found.', 404, 'NOT_FOUND');
    if (trip.status !== 'DRAFT') throw new AppError(`Cannot dispatch a trip with status "${trip.status}".`, 422, 'INVALID_STATUS');

    // Vehicle checks
    const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError('Vehicle not found.', 404, 'NOT_FOUND');
    if (vehicle.status !== 'AVAILABLE') {
      throw new AppError(`Vehicle is not available (current status: ${vehicle.status}).`, 422, 'VEHICLE_NOT_AVAILABLE');
    }

    // Cargo capacity check
    const cargoWeight = parseFloat(trip.cargoWeightKg);
    const capacity = parseFloat(vehicle.capacityKg);
    if (cargoWeight > capacity) {
      throw new AppError(
        `Capacity exceeded by ${cargoWeight - capacity} kg — dispatch blocked. Cargo: ${cargoWeight} kg, Vehicle capacity: ${capacity} kg.`,
        422,
        'CAPACITY_EXCEEDED'
      );
    }

    // Driver checks
    const driver = await tx.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new AppError('Driver not found.', 404, 'NOT_FOUND');
    if (driver.status !== 'AVAILABLE') {
      throw new AppError(`Driver is not available (current status: ${driver.status}).`, 422, 'DRIVER_NOT_AVAILABLE');
    }
    if (driver.status === 'SUSPENDED') {
      throw new AppError('Suspended drivers cannot be assigned to trips.', 422, 'DRIVER_SUSPENDED');
    }
    if (new Date(driver.licenseExpiry) < new Date()) {
      throw new AppError(`Driver license (${driver.licenseNo}) expired on ${new Date(driver.licenseExpiry).toDateString()}.`, 422, 'LICENSE_EXPIRED');
    }

    // Atomic state transitions
    const [updatedTrip] = await Promise.all([
      tx.trip.update({
        where: { id: tripId },
        data: { vehicleId, driverId, status: 'DISPATCHED', dispatchedAt: new Date(), startOdometer: vehicle.odometer },
        include: { vehicle: true, driver: true },
      }),
      tx.vehicle.update({ where: { id: vehicleId }, data: { status: 'ON_TRIP' } }),
      tx.driver.update({ where: { id: driverId }, data: { status: 'ON_TRIP' } }),
      tx.auditLog.create({
        data: {
          userId,
          action: 'TRIP_DISPATCHED',
          entity: 'Trip',
          entityId: tripId,
          before: { status: 'DRAFT' },
          after: { status: 'DISPATCHED', vehicleId, driverId },
        },
      }),
    ]);

    return updatedTrip;
  });
};

/**
 * COMPLETE — capture actuals, restore vehicle + driver.
 */
const complete = async (tripId, { endOdometer, fuelUsedLiters, revenue, fuelStation }, userId) => {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId }, include: { vehicle: true, driver: true } });
    if (!trip) throw new AppError('Trip not found.', 404, 'NOT_FOUND');
    if (trip.status !== 'DISPATCHED') throw new AppError(`Cannot complete a trip with status "${trip.status}".`, 422, 'INVALID_STATUS');

    const startOdo = parseFloat(trip.startOdometer || 0);
    const endOdo = parseFloat(endOdometer);
    if (endOdo < startOdo) {
      throw new AppError(`End odometer (${endOdo}) must be ≥ start odometer (${startOdo}).`, 422, 'INVALID_ODOMETER');
    }
    const actualDistance = endOdo - startOdo;

    const updates = [
      tx.trip.update({
        where: { id: tripId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          endOdometer: endOdo,
          actualDistanceKm: actualDistance,
          fuelUsedLiters: fuelUsedLiters ? parseFloat(fuelUsedLiters) : null,
          revenue: revenue ? parseFloat(revenue) : 0,
        },
        include: { vehicle: true, driver: true },
      }),
      tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE', odometer: endOdo } }),
      tx.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } }),
      tx.auditLog.create({
        data: { userId, action: 'TRIP_COMPLETED', entity: 'Trip', entityId: tripId, before: { status: 'DISPATCHED' }, after: { status: 'COMPLETED' } },
      }),
    ];

    if (fuelUsedLiters) {
      updates.push(
        tx.fuelLog.create({
          data: {
            vehicleId: trip.vehicleId,
            tripId,
            liters: parseFloat(fuelUsedLiters),
            cost: 0, // cost can be updated separately
            date: new Date(),
            fuelStation: fuelStation || null,
          },
        })
      );
    }

    const [updatedTrip] = await Promise.all(updates);
    return updatedTrip;
  });
};

/**
 * CANCEL — restore vehicle + driver if was DISPATCHED.
 */
const cancel = async (tripId, { cancelReason }, userId) => {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new AppError('Trip not found.', 404, 'NOT_FOUND');
    if (!['DRAFT', 'DISPATCHED'].includes(trip.status)) {
      throw new AppError(`Cannot cancel a trip with status "${trip.status}".`, 422, 'INVALID_STATUS');
    }
    if (!cancelReason) throw new AppError('Cancel reason is required.', 400, 'VALIDATION_ERROR');

    const updates = [
      tx.trip.update({
        where: { id: tripId },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason },
        include: { vehicle: true, driver: true },
      }),
      tx.auditLog.create({
        data: { userId, action: 'TRIP_CANCELLED', entity: 'Trip', entityId: tripId, before: { status: trip.status }, after: { status: 'CANCELLED', cancelReason } },
      }),
    ];

    // Only restore if was DISPATCHED (resources were reserved)
    if (trip.status === 'DISPATCHED') {
      if (trip.vehicleId) updates.push(tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } }));
      if (trip.driverId) updates.push(tx.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } }));
    }

    const [updatedTrip] = await Promise.all(updates);
    return updatedTrip;
  });
};

module.exports = { getAll, getById, create, dispatch, complete, cancel };
