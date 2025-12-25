import type { Bot } from 'grammy';

import type { Language } from '@archetypes/shared';

import type { MyContext } from '../../utils/context.js';
import { t, isAuthorized, getTelegramId } from '../../utils/helpers.js';
import { initialSession } from '../../utils/context.js';
import { api } from '../../services/api.js';
import { audit, AuditAction } from '../../services/audit.js';
import { createMainKeyboard, createLanguageKeyboard } from './keyboards.js';

export function setupStartHandlers(bot: Bot<MyContext>): void {
  // /start - начало работы
  bot.command('start', async (ctx) => {
    const telegramId = getTelegramId(ctx);

    // Логируем
    await audit.log({
      action: AuditAction.START_COMMAND,
      telegramId,
      data: { username: ctx.from?.username },
    });

    // Выходим из активной конверсации если есть
    await ctx.conversation.exit();

    // Если есть активная сессия тестирования - прерываем её
    if (ctx.session.sessionId) {
      try {
        await api.abandonSession(ctx.session.sessionId);
      } catch {
        // Игнорируем ошибки - сессия могла быть уже завершена
      }
    }

    // Сохраняем флаг выбора языка перед сбросом
    const languageWasSelected = ctx.session.languageSelected;
    const savedLanguage = ctx.session.language;

    // Сбрасываем сессию
    ctx.session = initialSession();

    // Если язык был ранее выбран - восстанавливаем
    if (languageWasSelected) {
      ctx.session.language = savedLanguage;
      ctx.session.languageSelected = true;

      const messages = t(ctx);
      await ctx.reply(messages.welcome, {
        reply_markup: createMainKeyboard(messages),
      });
    } else {
      // Первый запуск - показываем выбор языка
      await ctx.reply('👋 Hello! Choose your language:', {
        reply_markup: createLanguageKeyboard(),
      });
    }
  });

  // /help - помощь
  bot.command('help', async (ctx) => {
    const messages = t(ctx);
    await ctx.reply(messages.help);
  });

  // /language - смена языка
  bot.command('language', async (ctx) => {
    await ctx.reply('🌐 Choose your language:', {
      reply_markup: createLanguageKeyboard(),
    });
  });

  // /delete - удаление профиля
  bot.command('delete', async (ctx) => {
    const telegramId = getTelegramId(ctx);
    const messages = t(ctx);

    // Проверяем есть ли профиль
    const player = await api.getPlayerByTelegramId(telegramId);
    if (!player) {
      await ctx.reply(messages.delete.notFound);
      return;
    }

    // Показываем подтверждение
    await ctx.reply(messages.delete.confirm, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: messages.keyboards.confirmDelete, callback_data: 'confirm_delete' },
            { text: messages.keyboards.cancel, callback_data: 'cancel_delete' },
          ],
        ],
      },
    });
  });

  // /cancel - отмена
  bot.command('cancel', async (ctx) => {
    // Если есть активная сессия, прерываем её
    if (ctx.session.sessionId) {
      await api.abandonSession(ctx.session.sessionId);
      ctx.session.sessionId = undefined;
    }

    // Выходим из conversation если есть
    await ctx.conversation.exit();

    const messages = t(ctx);
    await ctx.reply(messages.cancel, {
      reply_markup: createMainKeyboard(messages),
    });
  });

  // Callback: начать тест
  bot.callbackQuery('start_test', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = getTelegramId(ctx);

    await audit.log({
      action: AuditAction.START_TEST_CLICKED,
      telegramId,
      playerId: ctx.session.playerId,
    });

    if (!isAuthorized(ctx)) {
      // Нужна авторизация через PIN
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

  // Callback: сменить язык
  bot.callbackQuery('change_language', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({
      reply_markup: createLanguageKeyboard(),
    });
  });

  // Callback: выбор языка
  bot.callbackQuery(/^lang_(.+)$/, async (ctx) => {
    const lang = ctx.match[1] as Language;
    const isFirstSelection = !ctx.session.languageSelected;

    ctx.session.language = lang;
    ctx.session.languageSelected = true;

    await audit.log({
      action: AuditAction.LANGUAGE_CHANGED,
      telegramId: getTelegramId(ctx),
      playerId: ctx.session.playerId,
      data: { language: lang, isFirstSelection },
    });

    await ctx.answerCallbackQuery();

    const messages = t(ctx);

    if (isFirstSelection) {
      // Первый выбор языка - показываем приветствие
      await ctx.editMessageText(messages.welcome, {
        reply_markup: createMainKeyboard(messages),
      });
    } else {
      // Смена языка - показываем подтверждение
      await ctx.editMessageText(messages.languageChanged, {
        reply_markup: createMainKeyboard(messages),
      });
    }
  });

  // Callback: продолжить flow (после PIN)
  bot.callbackQuery('continue_flow', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = getTelegramId(ctx);

    const nextStep = ctx.session.nextStep;

    // Логируем в audit
    await audit.log({
      action: AuditAction.CONTINUE_FLOW_CLICKED,
      telegramId,
      playerId: ctx.session.playerId,
      data: {
        nextStep,
        sessionState: {
          playerId: ctx.session.playerId,
          language: ctx.session.language,
        },
      },
    });

    if (nextStep === 'registration') {
      ctx.session.nextStep = undefined;
      await ctx.conversation.enter('registration');
    } else if (nextStep === 'session') {
      ctx.session.nextStep = undefined;
      await ctx.conversation.enter('session');
    } else {
      // Нет nextStep - проверим есть ли playerId
      if (ctx.session.playerId) {
        // Есть playerId - значит PIN прошёл, но nextStep потерялся
        // Проверим есть ли у игрока имя
        const player = await api.getPlayerByTelegramId(getTelegramId(ctx));
        if (player && player.name) {
          await ctx.conversation.enter('session');
        } else {
          await ctx.conversation.enter('registration');
        }
      } else {
        // Нет данных - показать главное меню
        const messages = t(ctx);
        await ctx.editMessageText(messages.welcome, {
          reply_markup: createMainKeyboard(messages),
        });
      }
    }
  });

  // Callback: отмена
  bot.callbackQuery('cancel', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.exit();

    if (ctx.session.sessionId) {
      await api.abandonSession(ctx.session.sessionId);
      ctx.session.sessionId = undefined;
    }

    const messages = t(ctx);
    await ctx.editMessageText(messages.cancel);
    await ctx.reply(messages.welcome, {
      reply_markup: createMainKeyboard(messages),
    });
  });

  // Callback: подтверждение удаления
  bot.callbackQuery('confirm_delete', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = getTelegramId(ctx);
    const messages = t(ctx);

    try {
      await api.deletePlayer(telegramId);

      // Сбрасываем сессию
      ctx.session = initialSession();
      ctx.session.language = messages === t(ctx) ? ctx.session.language : 'ru';

      await ctx.editMessageText(messages.delete.success);

      await audit.log({
        action: AuditAction.LANGUAGE_CHANGED, // Reuse for delete action
        telegramId,
        data: { action: 'player_deleted' },
      });
    } catch (error) {
      await ctx.editMessageText(messages.delete.notFound);
    }
  });

  // Callback: отмена удаления
  bot.callbackQuery('cancel_delete', async (ctx) => {
    await ctx.answerCallbackQuery();
    const messages = t(ctx);
    await ctx.editMessageText(messages.delete.cancelled);
  });
}
