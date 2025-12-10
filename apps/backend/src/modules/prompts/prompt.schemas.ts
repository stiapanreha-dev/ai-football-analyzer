import { z } from 'zod';
import { PROMPT_KEYS } from '@archetypes/shared';

export const promptKeySchema = z.enum(PROMPT_KEYS);

export const getPromptParamsSchema = z.object({
  key: promptKeySchema,
});

export const updatePromptBodySchema = z.object({
  value: z.string().min(10, 'Промпт должен содержать минимум 10 символов'),
});

export type GetPromptParams = z.infer<typeof getPromptParamsSchema>;
export type UpdatePromptBody = z.infer<typeof updatePromptBodySchema>;
