import { z } from 'zod';

export const playerPositionSchema = z.enum(['goalkeeper', 'defender', 'midfielder', 'forward', 'staff']);

export const createPlayerSchema = z.object({
  telegramId: z.union([z.bigint(), z.number().int().positive()]),
  name: z.string().min(1).max(100).optional(),
  position: playerPositionSchema.optional(),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
});

export const updatePlayerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  position: playerPositionSchema.optional(),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
});

export const getPlayerParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const getPlayerByTelegramIdParamsSchema = z.object({
  telegramId: z.coerce.bigint(),
});

export const getPlayersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  position: playerPositionSchema.optional(),
  sortBy: z.enum(['name', 'createdAt', 'sessionsCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type GetPlayerParams = z.infer<typeof getPlayerParamsSchema>;
export type GetPlayerByTelegramIdParams = z.infer<typeof getPlayerByTelegramIdParamsSchema>;
export type GetPlayersQuery = z.infer<typeof getPlayersQuerySchema>;
