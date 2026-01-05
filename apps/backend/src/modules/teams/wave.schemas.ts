import { z } from 'zod';

export const teamIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const waveIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  waveId: z.coerce.number().int().positive(),
});

export const createWaveBodySchema = z.object({
  name: z.string().optional(),
});

export type TeamIdParams = z.infer<typeof teamIdParamsSchema>;
export type WaveIdParams = z.infer<typeof waveIdParamsSchema>;
export type CreateWaveBody = z.infer<typeof createWaveBodySchema>;
