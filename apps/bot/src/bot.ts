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
import { pinConversation } from './features/pin/conversation.js';
import { registrationConversation } from './features/registration/conversation.js';
import { sessionConversation } from './features/session/conversation.js';

export async function createBot(): Promise<Bot<MyContext>> {
  const bot = new Bot<MyContext>(config.botToken);

  // Redis adapter для хранения сессий
  const redis = new Redis(config.redisUrl);

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

  // Session (Redis storage)
  bot.use(
    session({
      initial: initialSession,
      storage: {
        read: async (key: string) => {
          const data = await redis.get(`session:${key}`);
          if (data) {
            return JSON.parse(data) as SessionData;
          }
          return undefined;
        },
        write: async (key: string, value: SessionData) => {
          await redis.set(`session:${key}`, JSON.stringify(value), 'EX', 86400 * 7); // 7 days
        },
        delete: async (key: string) => {
          await redis.del(`session:${key}`);
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

  logger.info('Bot created and configured');

  return bot;
}
