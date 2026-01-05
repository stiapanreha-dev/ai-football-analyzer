import type { Bot } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { Redis } from 'ioredis';

import type { WaveNotificationPayload, Language } from '@archetypes/shared';

import { config } from '../config.js';
import { logger } from '../middleware/logging.js';
import type { MyContext } from '../utils/context.js';
import { getMessages } from '../locales/index.js';

const REDIS_CHANNEL = 'bot:notifications';

let subscriber: Redis | null = null;

/**
 * Запустить listener для push-уведомлений из backend
 */
export function startPushListener(bot: Bot<MyContext>): void {
  subscriber = new Redis(config.redisUrl);

  subscriber.subscribe(REDIS_CHANNEL, (err) => {
    if (err) {
      logger.error({ error: err }, 'Failed to subscribe to Redis channel');
      return;
    }
    logger.info(`Subscribed to Redis channel: ${REDIS_CHANNEL}`);
  });

  subscriber.on('message', async (channel, message) => {
    if (channel !== REDIS_CHANNEL) return;

    try {
      const payload = JSON.parse(message) as WaveNotificationPayload;

      if (payload.type === 'wave_start') {
        await handleWaveStart(bot, payload);
      }
    } catch (error) {
      logger.error({ error, message }, 'Failed to process push notification');
    }
  });

  subscriber.on('error', (error) => {
    logger.error({ error }, 'Redis subscriber error');
  });
}

/**
 * Остановить listener
 */
export async function stopPushListener(): Promise<void> {
  if (subscriber) {
    await subscriber.unsubscribe(REDIS_CHANNEL);
    await subscriber.quit();
    subscriber = null;
    logger.info('Push listener stopped');
  }
}

/**
 * Обработать уведомление о старте волны тестирования
 */
async function handleWaveStart(bot: Bot<MyContext>, payload: WaveNotificationPayload): Promise<void> {
  logger.info({ waveId: payload.waveId, teamName: payload.teamName, participantsCount: payload.participants.length }, 'Processing wave start notification');

  for (const participant of payload.participants) {
    try {
      const lang = (participant.language || 'ru') as Language;
      const t = getMessages(lang);

      const keyboard = new InlineKeyboard()
        .text(t.wave.startTestButton, `start_wave_test:${payload.waveId}`);

      await bot.api.sendMessage(
        participant.telegramId,
        t.wave.notification(payload.teamName),
        { reply_markup: keyboard }
      );

      logger.debug({ playerId: participant.playerId, telegramId: participant.telegramId }, 'Wave notification sent');
    } catch (error) {
      logger.error({ error, playerId: participant.playerId, telegramId: participant.telegramId }, 'Failed to send wave notification');
    }
  }

  logger.info({ waveId: payload.waveId, sent: payload.participants.length }, 'Wave notifications sent');
}
