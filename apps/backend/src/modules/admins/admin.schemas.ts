import { z } from 'zod';

export const createAdminSchema = z.object({
  telegramId: z.coerce.bigint(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  username: z.string().min(1).max(100).optional(),
});

export const updateAdminSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  username: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const getAdminParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const getAdminsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  isActive: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
export type GetAdminParams = z.infer<typeof getAdminParamsSchema>;
export type GetAdminsQuery = z.infer<typeof getAdminsQuerySchema>;
