import { z } from 'zod';

export const loginBodySchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const telegramAuthSchema = z.object({
  id: z.coerce.number().int().positive(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().url().optional(),
  auth_date: z.coerce.number().int().positive(),
  hash: z.string().min(1),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type TelegramAuthBody = z.infer<typeof telegramAuthSchema>;
