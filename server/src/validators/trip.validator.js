const { z } = require('zod');

const createTripSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  destination: z.string().min(1, 'Destination is required'),
  vehicleId: z.string().optional().nullable(),
  driverId: z.string().optional().nullable(),
  cargoWeightKg: z.coerce.number().positive('Cargo weight must be positive'),
  plannedDistanceKm: z.coerce.number().positive('Planned distance must be positive'),
  revenue: z.coerce.number().nonnegative().optional(),
});

const dispatchTripSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
  startOdometer: z.coerce.number().nonnegative('Start odometer must be non-negative'),
});

const completeTripSchema = z.object({
  endOdometer: z.coerce.number().nonnegative('End odometer must be non-negative'),
  fuelUsedLiters: z.coerce.number().nonnegative().optional(),
  fuelCost: z.coerce.number().nonnegative().optional(),
  revenue: z.coerce.number().nonnegative().optional(),
});

const cancelTripSchema = z.object({
  cancelReason: z.string().min(1, 'Cancellation reason is required'),
});

module.exports = { createTripSchema, dispatchTripSchema, completeTripSchema, cancelTripSchema };
