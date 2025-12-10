import type { ErrorHandler } from 'grammy';

import type { MyContext } from '../utils/context.js';
import { logger } from './logging.js';
import { t } from '../utils/helpers.js';

export const errorHandler: ErrorHandler<MyContext> = async (err) => {
  const ctx = err.ctx;
  const error = err.error;

  logger.error(
    {
      error,
      userId: ctx.from?.id,
      chatId: ctx.chat?.id,
    },
    'Bot error occurred'
  );

  // Пытаемся отправить сообщение пользователю
  try {
    const messages = t(ctx);
    await ctx.reply(messages.errors.general);
  } catch (e) {
    logger.error({ error: e }, 'Failed to send error message to user');
  }
};
