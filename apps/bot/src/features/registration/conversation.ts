import type { Conversation } from '@grammyjs/conversations';

import type { MyContext } from '../../utils/context.js';
import { t, getTelegramId } from '../../utils/helpers.js';
import { api } from '../../services/api.js';
import { audit, AuditAction } from '../../services/audit.js';
import { createPositionKeyboard, createContinueKeyboard } from '../start/keyboards.js';

export async function registrationConversation(
  conversation: Conversation<MyContext>,
  ctx: MyContext
): Promise<void> {
  const messages = t(ctx);
  const telegramId = getTelegramId(ctx);

  const playerId = conversation.session.playerId;

  await conversation.external(() =>
    audit.log({
      action: AuditAction.REGISTRATION_STARTED,
      telegramId,
      playerId,
    })
  );

  // Запрашиваем имя
  await ctx.reply(messages.registration.askName);
  const nameResponse = await conversation.waitFor('message:text');
  const name = nameResponse.message.text.trim();

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
  await nameResponse.reply(messages.registration.askPosition, {
    reply_markup: createPositionKeyboard(messages),
  });

  // Ждём callback с позицией
  const positionResponse = await conversation.waitForCallbackQuery(/^position_(.+)$/);
  await positionResponse.answerCallbackQuery();

  const position = positionResponse.match[1] as 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
  conversation.session.registration = { name, position };

  await conversation.external(() =>
    audit.log({
      action: AuditAction.REGISTRATION_POSITION_SELECTED,
      telegramId,
      playerId,
      data: { position },
    })
  );

  // Сохраняем данные через API
  await conversation.external(() =>
    api.updatePlayer(telegramId, { name, position })
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
    reply_markup: createContinueKeyboard(),
  });
}
