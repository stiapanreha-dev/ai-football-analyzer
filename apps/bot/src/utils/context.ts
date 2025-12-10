import type { Context, SessionFlavor } from 'grammy';
import type { ConversationFlavor } from '@grammyjs/conversations';
import type { HydrateFlavor } from '@grammyjs/hydrate';

import type { Language } from '@archetypes/shared';

/**
 * Данные сессии пользователя
 */
export interface SessionData {
  /** ID игрока из базы */
  playerId?: number | undefined;
  /** Выбранный язык */
  language: Language;
  /** ID текущей сессии тестирования */
  sessionId?: string | undefined;
  /** Данные регистрации (временные) */
  registration?: {
    name?: string | undefined;
    position?: string | undefined;
  } | undefined;
  /** Счётчик попыток PIN */
  pinAttempts?: number | undefined;
  /** Следующий шаг после выхода из conversation */
  nextStep?: 'registration' | 'session' | undefined;
}

/**
 * Базовый контекст с session и conversation
 */
export type MyContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor &
  HydrateFlavor<Context>;

/**
 * Тип conversation
 */
export type MyConversation = ConversationFlavor['conversation'];

/**
 * Начальные данные сессии
 */
export function initialSession(): SessionData {
  return {
    language: 'ru',
  };
}
