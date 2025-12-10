import type { MiddlewareFn } from 'grammy';

import type { MyContext } from '../utils/context.js';
import { t, isAuthorized } from '../utils/helpers.js';

/**
 * Middleware для проверки авторизации
 * Используется только для защищённых команд
 */
export const authMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
  if (!isAuthorized(ctx)) {
    const messages = t(ctx);
    await ctx.reply(messages.errors.notAuthorized);
    return;
  }

  await next();
};
