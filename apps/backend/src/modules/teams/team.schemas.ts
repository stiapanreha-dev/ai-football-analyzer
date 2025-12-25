import { z } from 'zod';

export const createTeamBodySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  playerIds: z.array(z.number().int().positive()).optional(),
});

export const updateTeamBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

export const teamIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const addPlayersBodySchema = z.object({
  playerIds: z.array(z.number().int().positive()).min(1),
});

export const removePlayersBodySchema = z.object({
  playerIds: z.array(z.number().int().positive()).min(1),
});

export const getTeamsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export type CreateTeamBody = z.infer<typeof createTeamBodySchema>;
export type UpdateTeamBody = z.infer<typeof updateTeamBodySchema>;
export type TeamIdParams = z.infer<typeof teamIdParamsSchema>;
export type AddPlayersBody = z.infer<typeof addPlayersBodySchema>;
export type RemovePlayersBody = z.infer<typeof removePlayersBodySchema>;
export type GetTeamsQuery = z.infer<typeof getTeamsQuerySchema>;
