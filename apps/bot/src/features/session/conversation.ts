import type { Conversation } from '@grammyjs/conversations';

import { VOICE_MIN_DURATION_SEC, VOICE_MAX_DURATION_SEC, TEXT_MIN_LENGTH, MAX_SITUATIONS } from '@archetypes/shared';

import type { MyContext } from '../../utils/context.js';
import { t, getTelegramId } from '../../utils/helpers.js';
import { api } from '../../services/api.js';
import { audit, AuditAction } from '../../services/audit.js';
import { processVoiceMessage } from '../../services/voice.js';
import { createMainKeyboard } from '../start/keyboards.js';

// Варианты вопросов к альтернативному ответу (рандомно выбираем)
const ALTERNATIVE_QUESTION_KEYS = [
  'alternativeQuestion1',
  'alternativeQuestion2',
  'alternativeQuestion3',
] as const;

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
    situationIndex = session.situationIndex + 1;
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

  // Основной цикл: 3 ситуации
  while (!isComplete && situationIndex <= MAX_SITUATIONS) {
    // ========== 1. Получаем и показываем ситуацию ==========
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

    // ========== 2. Получаем основной ответ игрока ==========
    let answerAccepted = false;
    let result: Awaited<ReturnType<typeof api.submitAnswer>> | null = null;

    while (!answerAccepted) {
      const answerText = await waitForAnswer(conversation, ctx, messages, session.id, telegramId, playerId, situationIndex);
      if (answerText === null) {
        // Сессия отменена
        return;
      }

      // Отправляем ответ на анализ
      try {
        result = await conversation.external(() =>
          api.submitAnswer(session.id, answerText)
        );
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
        continue;
      }

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
          unpresentArchetypes: result!.unpresentArchetypes,
          isSessionComplete: result!.isSessionComplete,
        },
      })
    );

    // ========== 3. Цикл по непроявленным архетипам ==========
    // Используем динамический список, который обновляется после каждого clarification
    let remainingArchetypes = [...result!.unpresentArchetypes];

    while (remainingArchetypes.length > 0) {
      const archetypeCode = remainingArchetypes[0]!;

      // 3.1 Получаем альтернативный ответ
      let alt;
      try {
        alt = await conversation.external(() =>
          api.getAlternativeResponse(session.id, archetypeCode)
        );
      } catch (error) {
        await conversation.external(() =>
          audit.log({
            action: AuditAction.ERROR,
            telegramId,
            playerId,
            sessionId: session.id,
            success: false,
            errorMsg: `Failed to get alternative response: ${error instanceof Error ? error.message : 'Unknown error'}`,
          })
        );
        await ctx.reply(messages.errors.general);
        await ctx.reply(messages.welcome, { reply_markup: createMainKeyboard(messages) });
        conversation.session.sessionId = undefined;
        return;
      }

      // 3.2 Показываем альтернативу
      await ctx.reply(messages.session.alternativeIntro);
      await ctx.reply(alt.alternativeResponse);

      // 3.3 Задаём рандомный вопрос
      const questionIndex = Math.floor(Math.random() * ALTERNATIVE_QUESTION_KEYS.length);
      const questionKey = ALTERNATIVE_QUESTION_KEYS[questionIndex] ?? 'alternativeQuestion1';
      const question = messages.session[questionKey];
      await ctx.reply(question);

      // 3.4 Получаем комментарий игрока
      const commentText = await waitForAnswer(conversation, ctx, messages, session.id, telegramId, playerId, situationIndex, true);
      if (commentText === null) {
        // Сессия отменена
        return;
      }

      // 3.5 Отправляем комментарий на анализ и получаем обновлённый список архетипов
      let clarificationResult;
      try {
        clarificationResult = await conversation.external(() =>
          api.submitClarification(session.id, archetypeCode, commentText)
        );
      } catch (error) {
        await conversation.external(() =>
          audit.log({
            action: AuditAction.ERROR,
            telegramId,
            playerId,
            sessionId: session.id,
            success: false,
            errorMsg: `Failed to submit clarification: ${error instanceof Error ? error.message : 'Unknown error'}`,
          })
        );
        await ctx.reply(messages.errors.general);
        await ctx.reply(messages.welcome, { reply_markup: createMainKeyboard(messages) });
        conversation.session.sessionId = undefined;
        return;
      }

      // Обновляем список оставшихся архетипов (фильтрует подтверждённые)
      remainingArchetypes = clarificationResult.remainingArchetypes;

      await conversation.external(() =>
        audit.log({
          action: AuditAction.ANSWER_SUBMITTED,
          telegramId,
          playerId,
          sessionId: session.id,
          data: {
            situationIndex,
            type: 'clarification',
            archetypeCode,
            remainingCount: remainingArchetypes.length,
          },
        })
      );
    }

    // ========== 4. Переход к следующей ситуации ==========
    let nextResult;
    try {
      nextResult = await conversation.external(() =>
        api.nextSituation(session.id)
      );
    } catch (error) {
      await conversation.external(() =>
        audit.log({
          action: AuditAction.ERROR,
          telegramId,
          playerId,
          sessionId: session.id,
          success: false,
          errorMsg: `Failed to move to next situation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      );
      await ctx.reply(messages.errors.general);
      await ctx.reply(messages.welcome, { reply_markup: createMainKeyboard(messages) });
      conversation.session.sessionId = undefined;
      return;
    }

    isComplete = nextResult.isSessionComplete;
    situationIndex++;
  }

  // ========== 5. Завершаем сессию ==========
  try {
    await conversation.external(() => api.completeSession(session.id));
  } catch (error) {
    const apiError = error as { code?: string };
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
}

/**
 * Ожидание ответа от игрока (голосовое или текстовое сообщение)
 * @returns текст ответа или null если сессия отменена
 */
async function waitForAnswer(
  conversation: Conversation<MyContext>,
  ctx: MyContext,
  messages: ReturnType<typeof t>,
  sessionId: string,
  telegramId: bigint,
  playerId: number | undefined,
  situationIndex: number,
  isClarification = false
): Promise<string | null> {
  while (true) {
    const msgCtx = await conversation.wait();

    // Проверяем на отмену или /start (выход из conversation)
    if (msgCtx.message?.text === '/cancel' || msgCtx.message?.text === '/start' || msgCtx.callbackQuery?.data === 'cancel') {
      const reason = msgCtx.message?.text === '/start' ? 'user_restart' : 'user_cancel';
      await conversation.external(() =>
        audit.log({
          action: AuditAction.SESSION_ABANDONED,
          telegramId,
          playerId,
          sessionId,
          data: { situationIndex, reason },
        })
      );
      await conversation.external(() => api.abandonSession(sessionId));
      conversation.session.sessionId = undefined;

      if (msgCtx.message?.text === '/start') {
        // Для /start - просто выходим, start handler покажет меню
        return null;
      }

      await ctx.reply(messages.session.sessionAbandoned);
      await ctx.reply(messages.welcome, { reply_markup: createMainKeyboard(messages) });
      return null;
    }

    // Обработка текстового сообщения
    const text = msgCtx.message?.text;
    if (text) {
      // Проверяем минимальную длину
      if (text.length < TEXT_MIN_LENGTH) {
        await msgCtx.reply(messages.errors.textTooShort);
        continue;
      }

      await conversation.external(() =>
        audit.log({
          action: AuditAction.TEXT_RECEIVED,
          telegramId,
          playerId,
          sessionId,
          data: { situationIndex, textLength: text.length, isClarification },
        })
      );

      return text;
    }

    // Обработка голосового сообщения
    const voice = msgCtx.message?.voice;
    if (voice) {
      // Проверяем длительность
      if (voice.duration < VOICE_MIN_DURATION_SEC) {
        await msgCtx.reply(messages.errors.voiceTooShort);
        continue;
      }

      if (voice.duration > VOICE_MAX_DURATION_SEC) {
        await msgCtx.reply(messages.errors.voiceTooLong);
        continue;
      }

      // Транскрибируем
      await msgCtx.reply(messages.session.analyzing);

      await conversation.external(() =>
        audit.log({
          action: AuditAction.VOICE_RECEIVED,
          telegramId,
          playerId,
          sessionId,
          data: { situationIndex, duration: voice.duration, isClarification },
        })
      );

      try {
        const answerText = await conversation.external(() =>
          processVoiceMessage(ctx, voice.file_id, voice.mime_type)
        );

        await conversation.external(() =>
          audit.log({
            action: AuditAction.VOICE_TRANSCRIBED,
            telegramId,
            playerId,
            sessionId,
            data: { situationIndex, textLength: answerText?.length, isClarification },
          })
        );

        if (answerText) {
          return answerText;
        }
      } catch (error) {
        await conversation.external(() =>
          audit.log({
            action: AuditAction.VOICE_TRANSCRIPTION_FAILED,
            telegramId,
            playerId,
            sessionId,
            success: false,
            errorMsg: error instanceof Error ? error.message : 'Unknown error',
          })
        );

        await msgCtx.reply(messages.errors.transcriptionFailed);
        continue;
      }
    }

    // Игнорируем другие типы сообщений (стикеры, фото и т.д.)
  }
}
