import { PIN_CODE_LENGTH } from '../constants/limits.js';
import { ARCHETYPE_CODES, type ArchetypeCode } from '../constants/archetypes.js';

/**
 * Проверить валидность PIN-кода
 */
export function isPinCodeValid(code: string): boolean {
  return code.length === PIN_CODE_LENGTH && /^\d+$/.test(code);
}

/**
 * Проверить, является ли значение кодом архетипа
 */
export function isValidArchetypeCode(value: unknown): value is ArchetypeCode {
  return typeof value === 'string' && ARCHETYPE_CODES.includes(value as ArchetypeCode);
}

/**
 * Проверить валидность Telegram ID
 */
export function isValidTelegramId(value: unknown): boolean {
  if (typeof value === 'bigint') {
    return value > 0n;
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0;
  }
  return false;
}

/**
 * Проверить валидность номера на футболке
 */
export function isValidJerseyNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 99;
}

/**
 * Проверить валидность оценки архетипа (0-10)
 */
export function isValidScore(value: unknown): boolean {
  return typeof value === 'number' && value >= 0 && value <= 10;
}

/**
 * Проверить, является ли строка валидным UUID v4
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
