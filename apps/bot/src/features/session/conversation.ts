import type { Conversation } from '@grammyjs/conversations';

import { VOICE_MIN_DURATION_SEC, VOICE_MAX_DURATION_SEC, MAX_SITUATIONS } from '@archetypes/shared';

import type { MyContext } from '../../utils/context.js';
import { t, getTelegramId } from '../../utils/helpers.js';
import { api } from '../../services/api.js';
import { audit, AuditAction } from '../../services/audit.js';
import { processVoiceMessage } from '../../services/voice.js';
import { createMainKeyboard } from '../start/keyboards.js';

export async function sessionConversation(
  conversation: Conversation<MyContext>,
  ctx: MyContext
): Promise<void> {
  const messages = t(ctx);
  const telegramId = getTelegramId(ctx);
  const playerId = conversation.session.playerId;
  const language = conversation.session.language;

  await conversation.external(() =>
    audit.log({
      action: AuditAction.SESSION_STARTED,
      telegramId,
      playerId,
    })
  );

  if (!playerId) {
    await ctx.reply(messages.errors.notAuthorized);
    return;
  }

  // Проверяем, есть ли активная незавершённая сессия
  let session = await conversation.external(() =>
    api.getActiveSession(playerId)
  );

  let situationIndex = 1;

  if (session) {
    // Проверяем, не застряла ли сессия в состоянии generating_report
    if (session.phase === 'generating_report') {
      // Сессия застряла - завершаем её и создаём новую
      try {
        await conversation.external(() => api.completeSession(session!.id));
      } catch {
        // Игнорируем ошибки - сессия будет создана заново
      }
      session = null;
    }
  }

  if (session) {
    // Восстанавливаем сессию
    situationIndex = session.situationIndex + 1; // +1 потому что situationIndex это индекс последней ситуации (0-based)
    conversation.session.sessionId = session.id;

    await conversation.external(() =>
      audit.log({
        action: AuditAction.SESSION_RESUMED,
        telegramId,
        playerId,
        sessionId: session!.id,
        data: { situationIndex: session!.situationIndex },
      })
    );

    await ctx.reply(messages.session.resuming);
  }

  if (!session) {
    // Создаём новую сессию
    session = await conversation.external(() =>
      api.createSession(playerId, language)
    );
    situationIndex = 1;
    conversation.session.sessionId = session.id;

    await conversation.external(() =>
      audit.log({
        action: AuditAction.SESSION_CREATED,
        telegramId,
        playerId,
        sessionId: session!.id,
        data: { language },
      })
    );

    // Intro только для новой сессии
    await ctx.reply(messages.session.intro);
  }

  let isComplete = false;

  while (!isComplete && situationIndex <= MAX_SITUATIONS) {
    // Получаем ситуацию
    let situation;
    try {
      situation = await conversation.external(() => api.getCurrentSituation(session.id));
    } catch (error) {
      const apiError = error as { code?: string };
      if (apiError.code === 'SESSION_ALREADY_COMPLETED' || apiError.code === 'SESSION_INVALID_STATE') {
        await conversation.external(() =>
          audit.log({
            action: AuditAction.ERROR,
            telegramId,
            playerId,
            sessionId: session.id,
            success: false,
            errorMsg: `Session error: ${apiError.code}`,
          })
        );
        conversation.session.sessionId = undefined;
        await ctx.reply(messages.errors.noActiveSession);
        await ctx.reply(messages.welcome, { reply_markup: createMainKeyboard(messages) });
        return;
      }
      throw error;
    }

    if (!situation) {
      // Ситуации закончились
      break;
    }

    await conversation.external(() =>
      audit.log({
        action: AuditAction.SITUATION_RECEIVED,
        telegramId,
        playerId,
        sessionId: session.id,
        data: { situationIndex, situationId: situation.id },
      })
    );

    // Показываем ситуацию
    await ctx.reply(messages.session.situationNumber(situationIndex, MAX_SITUATIONS));
    await ctx.reply(situation.content);
    await ctx.reply(messages.session.waitingAnswer);

    // Цикл получения релевантного ответа (может быть несколько попыток при нерелевантных ответах)
    let answerAccepted = false;
    let result: Awaited<ReturnType<typeof api.submitAnswer>> | null = null;

    while (!answerAccepted) {
      // Ждём голосовое сообщение
      let answerText: string | null = null;

      while (!answerText) {
        const voiceCtx = await conversation.wait();

        // Проверяем на отмену
        if (voiceCtx.message?.text === '/cancel' || voiceCtx.callbackQuery?.data === 'cancel') {
          await conversation.external(() =>
            audit.log({
              action: AuditAction.SESSION_ABANDONED,
              telegramId,
              playerId,
              sessionId: session.id,
              data: { situationIndex, reason: 'user_cancel' },
            })
          );
          await conversation.external(() => api.abandonSession(session.id));
          conversation.session.sessionId = undefined;
          await ctx.reply(messages.session.sessionAbandoned);
          await ctx.reply(messages.welcome, { reply_markup: createMainKeyboard(messages) });
          return;
        }

        // Если текст вместо голоса
        if (voiceCtx.message?.text) {
          await voiceCtx.reply(messages.errors.textNotAllowed);
          continue;
        }

        // Проверяем голосовое сообщение
        const voice = voiceCtx.message?.voice;
        if (!voice) {
          continue;
        }

        // Проверяем длительность
        if (voice.duration < VOICE_MIN_DURATION_SEC) {
          await voiceCtx.reply(messages.errors.voiceTooShort);
          continue;
        }

        if (voice.duration > VOICE_MAX_DURATION_SEC) {
          await voiceCtx.reply(messages.errors.voiceTooLong);
          continue;
        }

        // Транскрибируем
        await voiceCtx.reply(messages.session.analyzing);

        await conversation.external(() =>
          audit.log({
            action: AuditAction.VOICE_RECEIVED,
            telegramId,
            playerId,
            sessionId: session.id,
            data: { situationIndex, duration: voice.duration },
          })
        );

        try {
          answerText = await conversation.external(() =>
            processVoiceMessage(ctx, voice.file_id, voice.mime_type)
          );

          await conversation.external(() =>
            audit.log({
              action: AuditAction.VOICE_TRANSCRIBED,
              telegramId,
              playerId,
              sessionId: session.id,
              data: { situationIndex, textLength: answerText?.length },
            })
          );
        } catch (error) {
          await conversation.external(() =>
            audit.log({
              action: AuditAction.VOICE_TRANSCRIPTION_FAILED,
              telegramId,
              playerId,
              sessionId: session.id,
              success: false,
              errorMsg: error instanceof Error ? error.message : 'Unknown error',
            })
          );

          await voiceCtx.reply(messages.errors.transcriptionFailed);
          continue;
        }
      }

      // Отправляем ответ на анализ
      try {
        result = await conversation.external(() =>
          api.submitAnswer(session.id, answerText!)
        );
      } catch (error) {
        // Если сессия уже завершена или в невалидном состоянии - выходим
        const apiError = error as { code?: string };
        if (apiError.code === 'SESSION_ALREADY_COMPLETED' || apiError.code === 'SESSION_INVALID_STATE') {
          await conversation.external(() =>
            audit.log({
              action: AuditAction.ERROR,
              telegramId,
              playerId,
              sessionId: session.id,
              success: false,
              errorMsg: `Session error: ${apiError.code}`,
            })
          );
          conversation.session.sessionId = undefined;
          await ctx.reply(messages.errors.noActiveSession);
          await ctx.reply(messages.welcome, { reply_markup: createMainKeyboard(messages) });
          return;
        }
        throw error;
      }

      // Проверяем, релевантен ли ответ
      if (result?.isIrrelevant) {
        await conversation.external(() =>
          audit.log({
            action: AuditAction.ANSWER_IRRELEVANT,
            telegramId,
            playerId,
            sessionId: session.id,
            data: { situationIndex, reason: result?.irrelevantReason },
          })
        );

        await ctx.reply(messages.errors.answerIrrelevant);
        await ctx.reply(messages.session.waitingAnswer);
        // Продолжаем цикл - ждём новый ответ
        continue;
      }

      // Ответ принят
      answerAccepted = true;
    }

    await conversation.external(() =>
      audit.log({
        action: AuditAction.ANSWER_SUBMITTED,
        telegramId,
        playerId,
        sessionId: session.id,
        data: {
          situationIndex,
          needsClarification: result!.needsClarification,
          isSessionComplete: result!.isSessionComplete,
        },
      })
    );

    // Проверяем, нужно ли уточнение
    if (result!.needsClarification && result!.clarificationQuestion) {
      await ctx.reply(messages.session.clarification);
      await ctx.reply(result!.clarificationQuestion);
      await ctx.reply(messages.session.waitingClarification);

      // Ждём уточняющий ответ
      let clarificationText: string | null = null;

      while (!clarificationText) {
        const clarCtx = await conversation.wait();

        if (clarCtx.message?.text === '/cancel') {
          await conversation.external(() => api.abandonSession(session.id));
          conversation.session.sessionId = undefined;
          await ctx.reply(messages.session.sessionAbandoned);
          return;
        }

        const voice = clarCtx.message?.voice;
        if (!voice) {
          if (clarCtx.message?.text) {
            await clarCtx.reply(messages.errors.textNotAllowed);
          }
          continue;
        }

        if (voice.duration < VOICE_MIN_DURATION_SEC) {
          await clarCtx.reply(messages.errors.voiceTooShort);
          continue;
        }

        try {
          clarificationText = await conversation.external(() =>
            processVoiceMessage(ctx, voice.file_id, voice.mime_type)
          );
        } catch {
          await clarCtx.reply(messages.errors.transcriptionFailed);
          continue;
        }
      }

      // Отправляем уточнение
      if (result!.clarificationArchetype && clarificationText) {
        result = await conversation.external(() =>
          api.submitClarification(session.id, result!.clarificationArchetype!, clarificationText!)
        );
      }
    }

    // Проверяем завершение
    isComplete = result!.isSessionComplete;
    situationIndex++;
  }

  // Завершаем сессию
  try {
    await conversation.external(() => api.completeSession(session.id));
  } catch (error) {
    const apiError = error as { code?: string };
    // Если сессия уже завершена - это нормально, продолжаем показывать результаты
    if (apiError.code !== 'SESSION_ALREADY_COMPLETED') {
      await conversation.external(() =>
        audit.log({
          action: AuditAction.ERROR,
          telegramId,
          playerId,
          sessionId: session.id,
          success: false,
          errorMsg: `Failed to complete session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      );
      throw error;
    }
  }

  await conversation.external(() =>
    audit.log({
      action: AuditAction.SESSION_COMPLETED,
      telegramId,
      playerId,
      sessionId: session.id,
      data: { totalSituations: situationIndex - 1 },
    })
  );

  await ctx.reply(messages.session.sessionComplete);
  await ctx.reply(messages.result.thankYou);
  conversation.session.sessionId = undefined;

  // Возвращаемся в главное меню
  await ctx.reply(messages.welcome, { reply_markup: createMainKeyboard(messages) });
}
