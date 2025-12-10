import type { Conversation } from '@grammyjs/conversations';

import { MAX_PIN_ATTEMPTS, isPinCodeValid } from '@archetypes/shared';

import type { MyContext } from '../../utils/context.js';
import { t, getTelegramId } from '../../utils/helpers.js';
import { api, ApiError } from '../../services/api.js';
import { audit, AuditAction } from '../../services/audit.js';
import { createMainKeyboard, createContinueKeyboard } from '../start/keyboards.js';

export async function pinConversation(
  conversation: Conversation<MyContext>,
  ctx: MyContext
): Promise<void> {
  const messages = t(ctx);
  const telegramId = getTelegramId(ctx);
  let attempts = 0;

  await ctx.reply(messages.pin.request);

  while (attempts < MAX_PIN_ATTEMPTS) {
    // Ждём текстовое сообщение с PIN-кодом
    const response = await conversation.waitFor('message:text');
    const code = response.message.text.trim();

    // Логируем ввод PIN
    await conversation.external(() =>
      audit.log({
        action: AuditAction.PIN_ENTERED,
        telegramId,
        data: { attempt: attempts + 1, codeLength: code.length },
      })
    );

    // Проверяем формат
    if (!isPinCodeValid(code)) {
      await conversation.external(() =>
        audit.log({
          action: AuditAction.PIN_INVALID,
          telegramId,
          success: false,
          data: { reason: 'invalid_format', attempt: attempts + 1 },
        })
      );

      await response.reply(messages.pin.invalidFormat);
      attempts++;

      if (attempts < MAX_PIN_ATTEMPTS) {
        await response.reply(messages.pin.attemptsLeft(MAX_PIN_ATTEMPTS - attempts));
      }
      continue;
    }

    // Валидируем через API
    try {
      const result = await conversation.external(() => api.validatePin(code, telegramId));

      if (result.valid && result.playerId) {
        // Успешная валидация - сохраняем в session через conversation
        conversation.session.playerId = result.playerId;

        await conversation.external(() =>
          audit.log({
            action: AuditAction.PIN_VALIDATED,
            telegramId,
            playerId: result.playerId,
            data: {
              isNewPlayer: result.isNewPlayer,
              hasPlayerData: !!result.playerData,
            },
          })
        );

        // Именной PIN - данные игрока уже заполнены на сервере
        if (result.playerData) {
          await response.reply(
            `✅ PIN-код принят!\n\nДобро пожаловать, ${result.playerData.name}! Ваши данные загружены автоматически.`,
            { reply_markup: createContinueKeyboard() }
          );
          conversation.session.nextStep = 'session';
          return;
        }

        if (result.isNewPlayer) {
          // Новый игрок - нужна регистрация
          conversation.session.nextStep = 'registration';
          await response.reply('✅ PIN-код принят! Давайте познакомимся.', {
            reply_markup: createContinueKeyboard(),
          });
          return;
        } else {
          // Существующий игрок
          const player = await conversation.external(() => api.getPlayerByTelegramId(telegramId));
          if (player?.name) {
            await response.reply(messages.registration.welcomeBack(player.name), {
              reply_markup: createContinueKeyboard(),
            });
            // Сохраняем флаг для запуска session conversation
            conversation.session.nextStep = 'session';
          } else {
            // Имя не заполнено - нужна регистрация
            conversation.session.nextStep = 'registration';
            await response.reply('✅ PIN-код принят! Давайте познакомимся.', {
              reply_markup: createContinueKeyboard(),
            });
          }
        }
        return;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        await conversation.external(() =>
          audit.log({
            action: AuditAction.PIN_INVALID,
            telegramId,
            success: false,
            data: { reason: error.code, attempt: attempts + 1 },
            errorMsg: error.message,
          })
        );

        switch (error.code) {
          case 'PIN_INVALID':
            await response.reply(messages.pin.invalid);
            break;
          case 'PIN_EXPIRED':
            await response.reply(messages.pin.expired);
            await response.reply(messages.welcome, { reply_markup: createMainKeyboard(messages) });
            return;
          case 'PIN_EXHAUSTED':
            await response.reply(messages.pin.exhausted);
            await response.reply(messages.welcome, { reply_markup: createMainKeyboard(messages) });
            return;
          case 'PIN_INACTIVE':
            await response.reply(messages.pin.inactive);
            await response.reply(messages.welcome, { reply_markup: createMainKeyboard(messages) });
            return;
          default:
            await response.reply(messages.errors.general);
            return;
        }
      } else {
        await conversation.external(() =>
          audit.log({
            action: AuditAction.ERROR,
            telegramId,
            success: false,
            errorMsg: error instanceof Error ? error.message : 'Unknown error',
          })
        );

        await response.reply(messages.errors.general);
        return;
      }
    }

    attempts++;
    if (attempts < MAX_PIN_ATTEMPTS) {
      await response.reply(messages.pin.attemptsLeft(MAX_PIN_ATTEMPTS - attempts));
    }
  }

  // Превышено количество попыток
  await conversation.external(() =>
    audit.log({
      action: AuditAction.PIN_INVALID,
      telegramId,
      success: false,
      data: { reason: 'too_many_attempts' },
    })
  );

  await ctx.reply(messages.pin.tooManyAttempts);
  await ctx.reply(messages.welcome, { reply_markup: createMainKeyboard(messages) });
}
