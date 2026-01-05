import type { Bot } from 'grammy';

import type { MyContext } from '../../utils/context.js';
import { t, isAuthorized, getTelegramId } from '../../utils/helpers.js';
import { api } from '../../services/api.js';
import { audit, AuditAction } from '../../services/audit.js';
import { logger } from '../../middleware/logging.js';

export function setupWaveHandlers(bot: Bot<MyContext>): void {
  // Callback: начать тест из волны
  bot.callbackQuery(/^start_wave_test:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();

    const match = ctx.match;
    if (!match || !match[1]) return;

    const waveId = parseInt(match[1], 10);
    const telegramId = getTelegramId(ctx);

    logger.info({ waveId, telegramId }, 'Wave test start clicked');

    await audit.log({
      action: AuditAction.START_TEST_CLICKED,
      telegramId,
      playerId: ctx.session.playerId,
      data: { waveId },
    });

    // Сохраняем waveId в сессии для дальнейшей привязки
    ctx.session.waveId = waveId;

    if (!isAuthorized(ctx)) {
      // Нужна авторизация через PIN
      // При этом, скорее всего, игрок уже зарегистрирован если его добавили в команду
      // Но всё равно требуем PIN для безопасности
      await ctx.conversation.enter('pin');
    } else {
      // Уже авторизован - проверяем регистрацию
      const player = await api.getPlayerByTelegramId(telegramId);
      if (player && player.name) {
        // Игрок зарегистрирован - начинаем сессию
        const messages = t(ctx);
        await ctx.reply(messages.registration.welcomeBack(player.name));
        await ctx.conversation.enter('session');
      } else {
        // Нужна регистрация
        await ctx.conversation.enter('registration');
      }
    }
  });
}
