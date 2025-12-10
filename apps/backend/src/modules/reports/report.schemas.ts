import { z } from 'zod';

export const getReportParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const getReportBySessionParamsSchema = z.object({
  sessionId: z.string().uuid(),
});

export const getReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  playerId: z.coerce.number().int().positive().optional(),
});

export type GetReportParams = z.infer<typeof getReportParamsSchema>;
export type GetReportBySessionParams = z.infer<typeof getReportBySessionParamsSchema>;
export type GetReportsQuery = z.infer<typeof getReportsQuerySchema>;
