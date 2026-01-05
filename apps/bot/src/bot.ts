import { Bot, session } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import { hydrate } from '@grammyjs/hydrate';
import { limit } from '@grammyjs/ratelimiter';
import { Redis } from 'ioredis';

import { config } from './config.js';
import type { MyContext, SessionData } from './utils/context.js';
import { initialSession } from './utils/context.js';
import { loggingMiddleware, logger } from './middleware/logging.js';
import { errorHandler } from './middleware/error.js';

// Features
import { setupStartFeature } from './features/start/index.js';
import { setupWaveFeature } from './features/wave/index.js';
import { pinConversation } from './features/pin/conversation.js';
import { registrationConversation } from './features/registration/conversation.js';
import { sessionConversation } from './features/session/conversation.js';
import { startPushListener, stopPushListener } from './services/push-listener.js';

// Таймаут для Redis операций
const REDIS_TIMEOUT = 5_000; // 5 сек

/**
 * Promise с таймаутом для предотвращения зависания
 */
function withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Redis ${operation} timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// Экспортируем redis для graceful shutdown
export let redis: Redis;

export async function createBot(): Promise<Bot<MyContext>> {
  const bot = new Bot<MyContext>(config.botToken);

  // Redis adapter для хранения сессий
  redis = new Redis(config.redisUrl);

  // Error handler
  bot.catch(errorHandler);

  // Middleware
  bot.use(loggingMiddleware);

  // Rate limiter
  bot.use(
    limit({
      timeFrame: 1000,
      limit: 3,
      onLimitExceeded: async (ctx) => {
        await ctx.reply('⚠️ Слишком много запросов. Подождите немного.');
      },
    })
  );

  // Hydrate (для редактирования сообщений)
  bot.use(hydrate());

  // Session (Redis storage with timeouts)
  bot.use(
    session({
      initial: initialSession,
      storage: {
        read: async (key: string) => {
          const data = await withTimeout(
            redis.get(`session:${key}`),
            REDIS_TIMEOUT,
            'read'
          );
          if (data) {
            return JSON.parse(data) as SessionData;
          }
          return undefined;
        },
        write: async (key: string, value: SessionData) => {
          await withTimeout(
            redis.set(`session:${key}`, JSON.stringify(value), 'EX', 86400 * 7),
            REDIS_TIMEOUT,
            'write'
          );
        },
        delete: async (key: string) => {
          await withTimeout(
            redis.del(`session:${key}`),
            REDIS_TIMEOUT,
            'delete'
          );
        },
      },
    })
  );

  // Conversations
  bot.use(conversations());

  // Регистрация conversations
  bot.use(createConversation(pinConversation, 'pin'));
  bot.use(createConversation(registrationConversation, 'registration'));
  bot.use(createConversation(sessionConversation, 'session'));

  // Features
  setupStartFeature(bot);
  setupWaveFeature(bot);

  // Push listener для уведомлений из backend
  startPushListener(bot);

  logger.info('Bot created and configured');

  return bot;
}

export { stopPushListener };
