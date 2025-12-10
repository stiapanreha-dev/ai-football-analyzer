import type { MyContext } from './context.js';
import { getMessages } from '../locales/index.js';

/**
 * Получить локализованные сообщения для контекста
 */
export function t(ctx: MyContext) {
  return getMessages(ctx.session.language);
}

/**
 * Получить Telegram ID пользователя
 */
export function getTelegramId(ctx: MyContext): bigint {
  const userId = ctx.from?.id;
  if (!userId) {
    throw new Error('No user ID in context');
  }
  return BigInt(userId);
}

/**
 * Форматирование имени пользователя
 */
export function getUserName(ctx: MyContext): string {
  const from = ctx.from;
  if (!from) return 'Unknown';

  if (from.first_name && from.last_name) {
    return `${from.first_name} ${from.last_name}`;
  }
  if (from.first_name) {
    return from.first_name;
  }
  if (from.username) {
    return `@${from.username}`;
  }
  return 'Unknown';
}

/**
 * Проверить, что пользователь авторизован (есть playerId)
 */
export function isAuthorized(ctx: MyContext): boolean {
  return !!ctx.session.playerId;
}

/**
 * Экранирование HTML символов для Telegram
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Форматирование времени в секундах
 */
export function formatVoiceDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs} сек`;
}
