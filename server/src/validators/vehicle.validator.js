const { z } = require('zod');

const createVehicleSchema = z.object({
  registrationNo: z.string().min(1, 'Registration number is required'),
  name: z.string().min(1, 'Vehicle name is required'),
  model: z.string().min(1, 'Model is required'),
  type: z.string().min(1, 'Vehicle type is required'),
  capacityKg: z.coerce.number().positive('Capacity must be positive'),
  acquisitionCost: z.coerce.number().nonnegative('Acquisition cost must be non-negative'),
  odometer: z.coerce.number().nonnegative().optional(),
  depotId: z.string().optional().nullable(),
});

const updateVehicleSchema = z.object({
  registrationNo: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  capacityKg: z.coerce.number().positive().optional(),
  acquisitionCost: z.coerce.number().nonnegative().optional(),
  odometer: z.coerce.number().nonnegative().optional(),
  depotId: z.string().optional().nullable(),
});

module.exports = { createVehicleSchema, updateVehicleSchema };
