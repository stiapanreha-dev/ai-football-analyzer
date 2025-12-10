import { z } from 'zod';

import { createPinSchema, validatePinSchema, getPinParamsSchema } from '@archetypes/shared';

export { createPinSchema, validatePinSchema, getPinParamsSchema };

export const getPinsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['single', 'multi', 'session', 'personal']).optional(),
  isActive: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

export type CreatePinInput = z.infer<typeof createPinSchema>;
export type ValidatePinInput = z.infer<typeof validatePinSchema>;
export type GetPinParams = z.infer<typeof getPinParamsSchema>;
export type GetPinsQuery = z.infer<typeof getPinsQuerySchema>;
