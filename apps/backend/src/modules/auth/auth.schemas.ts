import { z } from 'zod';

export const loginBodySchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
