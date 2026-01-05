import type { Conversation } from '@grammyjs/conversations';

import type { MyContext } from '../../utils/context.js';
import { t, getTelegramId } from '../../utils/helpers.js';
import { api } from '../../services/api.js';
import { audit, AuditAction } from '../../services/audit.js';
import { createPositionKeyboard, createContinueKeyboard } from '../start/keyboards.js';

const MAX_NAME_LENGTH = 50;

export async function registrationConversation(
  conversation: Conversation<MyContext>,
  ctx: MyContext
): Promise<void> {
  const messages = t(ctx);
  const telegramId = getTelegramId(ctx);

  // Очищаем предыдущие данные регистрации для предотвращения race condition
  conversation.session.registration = undefined;

  const playerId = conversation.session.playerId;

  await conversation.external(() =>
    audit.log({
      action: AuditAction.REGISTRATION_STARTED,
      telegramId,
      playerId,
    })
  );

  // Запрашиваем имя с валидацией
  let name = '';
  while (!name) {
    await ctx.reply(messages.registration.askName);
    const nameResponse = await conversation.waitFor('message:text');
    const rawName = nameResponse.message.text.trim();

    // Проверяем на /start или /cancel - выходим из conversation
    if (rawName === '/start' || rawName === '/cancel') {
      return; // Выходим, /start handler покажет меню
    }

    // Валидация длины имени (защита от сохранения тестовых ответов как имён)
    if (rawName.length > MAX_NAME_LENGTH) {
      await ctx.reply(messages.registration.nameTooLong ?? `Имя слишком длинное. Максимум ${MAX_NAME_LENGTH} символов.`);
      continue;
    }

    name = rawName;
  }

  await conversation.external(() =>
    audit.log({
      action: AuditAction.REGISTRATION_NAME_ENTERED,
      telegramId,
      playerId,
      data: { nameLength: name.length },
    })
  );

  conversation.session.registration = { name };

  // Запрашиваем позицию
  await ctx.reply(messages.registration.askPosition, {
    reply_markup: createPositionKeyboard(messages),
  });

  // Ждём callback с позицией
  const positionResponse = await conversation.waitForCallbackQuery(/^position_(.+)$/);
  await positionResponse.answerCallbackQuery();

  const position = positionResponse.match[1] as 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'staff';
  conversation.session.registration = { name, position };

  await conversation.external(() =>
    audit.log({
      action: AuditAction.REGISTRATION_POSITION_SELECTED,
      telegramId,
      playerId,
      data: { position },
    })
  );

  // Сохраняем данные через API (включая язык из сессии)
  const language = conversation.session.language;
  await conversation.external(() =>
    api.updatePlayer(telegramId, { name, position, language })
  );

  // Очищаем временные данные регистрации
  conversation.session.registration = undefined;

  await conversation.external(() =>
    audit.log({
      action: AuditAction.REGISTRATION_COMPLETED,
      telegramId,
      playerId,
      data: { name, position },
    })
  );

  // Уведомляем о завершении и предлагаем продолжить
  conversation.session.nextStep = 'session';
  await positionResponse.editMessageText(messages.registration.complete);
  await ctx.reply('🏟️ Отлично! Теперь начнём тестирование.', {
    reply_markup: createContinueKeyboard(messages),
  });
}
