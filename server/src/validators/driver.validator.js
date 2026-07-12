const { z } = require('zod');

const createDriverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  licenseNo: z.string().min(1, 'License number is required'),
  category: z.enum(['LMV', 'HMV'], { errorMap: () => ({ message: 'Category must be LMV or HMV' }) }),
  licenseExpiry: z.coerce.date({ errorMap: () => ({ message: 'Valid license expiry date is required' }) }),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().nullable(),
  safetyScore: z.coerce.number().int().min(0).max(100).optional(),
});

const updateDriverSchema = z.object({
  name: z.string().min(1).optional(),
  licenseNo: z.string().min(1).optional(),
  category: z.enum(['LMV', 'HMV']).optional(),
  licenseExpiry: z.coerce.date().optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  safetyScore: z.coerce.number().int().min(0).max(100).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'OFF_DUTY', 'SUSPENDED'], {
    errorMap: () => ({ message: 'Status must be AVAILABLE, OFF_DUTY, or SUSPENDED' }),
  }),
});

module.exports = { createDriverSchema, updateDriverSchema, updateStatusSchema };
