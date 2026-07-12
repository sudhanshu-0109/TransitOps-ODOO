const { z } = require('zod');

const createFuelLogSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  tripId: z.string().optional().nullable(),
  liters: z.coerce.number().positive('Liters must be positive'),
  cost: z.coerce.number().nonnegative('Cost must be non-negative'),
  fuelStation: z.string().optional().nullable(),
  date: z.coerce.date({ errorMap: () => ({ message: 'Valid date is required' }) }),
});

const createExpenseSchema = z.object({
  vehicleId: z.string().optional().nullable(),
  tripId: z.string().optional().nullable(),
  expenseType: z.enum(['FUEL', 'REPAIR', 'INSURANCE', 'PARKING', 'TOLL', 'MISC'], {
    errorMap: () => ({ message: 'Invalid expense type' }),
  }),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional().nullable(),
  date: z.coerce.date({ errorMap: () => ({ message: 'Valid date is required' }) }),
});

module.exports = { createFuelLogSchema, createExpenseSchema };
