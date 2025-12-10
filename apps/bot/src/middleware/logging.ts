import type { MiddlewareFn } from 'grammy';
import { pino } from 'pino';

import { config, isDevelopment } from '../config.js';
import type { MyContext } from '../utils/context.js';

export const logger = pino({
  level: config.logLevel,
  transport: isDevelopment()
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export const loggingMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
  const startTime = Date.now();

  const updateType = ctx.update.message
    ? 'message'
    : ctx.update.callback_query
      ? 'callback_query'
      : 'other';

  const userId = ctx.from?.id;
  const username = ctx.from?.username;

  logger.info(
    {
      updateType,
      userId,
      username,
      chatId: ctx.chat?.id,
      text: ctx.message?.text?.slice(0, 50),
    },
    'Incoming update'
  );

  try {
    await next();

    const duration = Date.now() - startTime;
    logger.info({ duration, userId }, 'Update processed');
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ error, duration, userId }, 'Update processing failed');
    throw error;
  }
};
