import { z } from 'zod';
import { PIN_CODE_LENGTH } from '../constants/limits.js';
import { playerPositionSchema } from './player.js';

export const pinTypeSchema = z.enum(['single', 'multi', 'session', 'personal']);

export const createPinSchema = z
  .object({
    type: pinTypeSchema,
    maxUses: z.number().int().min(1).max(1000).optional(),
    expiresInHours: z.number().int().min(1).max(720).optional(), // max 30 days
    // Поля для именного PIN
    playerName: z.string().min(2).max(100).optional(),
    playerPosition: playerPositionSchema.optional(),
    playerJerseyNumber: z.number().int().min(1).max(99).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'multi' && !data.maxUses) {
        return false;
      }
      return true;
    },
    {
      message: 'maxUses is required for multi-use pins',
      path: ['maxUses'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'session' && !data.expiresInHours) {
        return false;
      }
      return true;
    },
    {
      message: 'expiresInHours is required for session pins',
      path: ['expiresInHours'],
    }
  )
  .refine(
    (data) => {
      // Для именного PIN обязательны имя и позиция
      if (data.type === 'personal') {
        return !!data.playerName && !!data.playerPosition;
      }
      return true;
    },
    {
      message: 'playerName and playerPosition are required for personal pins',
      path: ['playerName'],
    }
  );

export const validatePinSchema = z.object({
  code: z
    .string()
    .length(PIN_CODE_LENGTH, `PIN code must be ${PIN_CODE_LENGTH} digits`)
    .regex(/^\d+$/, 'PIN code must contain only digits'),
  telegramId: z.union([z.bigint(), z.number().int().positive()]),
});

export const getPinParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreatePinInput = z.infer<typeof createPinSchema>;
export type ValidatePinInput = z.infer<typeof validatePinSchema>;
export type GetPinParams = z.infer<typeof getPinParamsSchema>;
