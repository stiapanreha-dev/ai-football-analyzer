import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from '../constants/languages.js';
import { VOICE_MIN_DURATION_SEC, VOICE_MAX_DURATION_SEC } from '../constants/limits.js';

export const languageSchema = z.enum(SUPPORTED_LANGUAGES);

export const sessionStatusSchema = z.enum([
  'created',
  'in_progress',
  'clarifying',
  'completed',
  'abandoned',
]);

export const sessionPhaseSchema = z.enum([
  'intro',
  'situation',
  'waiting_answer',
  'analyzing',
  'clarification',
  'generating_report',
]);

export const situationContextSchema = z.enum([
  'pressure',
  'conflict',
  'leadership',
  'tactical',
  'emotional',
  'failure',
]);

export const startSessionSchema = z.object({
  playerId: z.number().int().positive(),
  language: languageSchema,
});

export const getSessionParamsSchema = z.object({
  id: z.string().uuid(),
});

export const getSessionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  playerId: z.coerce.number().int().positive().optional(),
  status: sessionStatusSchema.optional(),
  sortBy: z.enum(['createdAt', 'completedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const submitAnswerSchema = z.object({
  text: z.string().min(10, 'Answer must be at least 10 characters'),
});

export const submitClarificationSchema = z.object({
  archetypeCode: z.enum(['leader', 'warrior', 'strategist', 'diplomat', 'executor', 'individualist', 'avoider']),
  text: z.string().min(5, 'Clarification must be at least 5 characters'),
});

export const voiceMessageSchema = z.object({
  duration: z
    .number()
    .min(VOICE_MIN_DURATION_SEC, `Voice message must be at least ${VOICE_MIN_DURATION_SEC} seconds`)
    .max(
      VOICE_MAX_DURATION_SEC,
      `Voice message must be at most ${VOICE_MAX_DURATION_SEC} seconds`
    ),
  fileId: z.string().min(1),
  mimeType: z.string().optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type GetSessionParams = z.infer<typeof getSessionParamsSchema>;
export type GetSessionsQuery = z.infer<typeof getSessionsQuerySchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type SubmitClarificationInput = z.infer<typeof submitClarificationSchema>;
export type VoiceMessageInput = z.infer<typeof voiceMessageSchema>;
