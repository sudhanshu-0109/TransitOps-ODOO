const { z } = require('zod');

const createMaintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  title: z.string().min(1, 'Title is required'),
  type: z.string().min(1, 'Service type is required'),
  cost: z.coerce.number().nonnegative('Cost must be non-negative'),
  startDate: z.coerce.date({ errorMap: () => ({ message: 'Valid start date is required' }) }),
  technician: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

module.exports = { createMaintenanceSchema };
