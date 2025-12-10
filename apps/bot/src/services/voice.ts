import type { MyContext } from '../utils/context.js';
import { api } from './api.js';
import { logger } from '../middleware/logging.js';
import { config } from '../config.js';

/**
 * Скачивание файла из Telegram
 */
async function downloadFile(fileId: string, botToken: string): Promise<Buffer> {
  // Получаем путь к файлу
  const fileInfoUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
  const fileInfoResponse = await fetch(fileInfoUrl);
  const fileInfo = (await fileInfoResponse.json()) as { ok: boolean; result: { file_path: string } };

  if (!fileInfo.ok) {
    throw new Error('Failed to get file info');
  }

  // Скачиваем файл
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.result.file_path}`;
  const fileResponse = await fetch(fileUrl);

  if (!fileResponse.ok) {
    throw new Error('Failed to download file');
  }

  const arrayBuffer = await fileResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Обработка голосового сообщения: скачивание + транскрибация
 */
export async function processVoiceMessage(
  ctx: MyContext,
  fileId: string,
  mimeType?: string
): Promise<string> {
  logger.info({ fileId }, 'Processing voice message');

  // Скачиваем файл
  const audioBuffer = await downloadFile(fileId, config.botToken);
  logger.debug({ size: audioBuffer.length }, 'Voice file downloaded');

  // Отправляем на транскрибацию
  const result = await api.transcribeAudio(
    audioBuffer,
    mimeType ?? 'audio/ogg',
    ctx.session.language
  );

  logger.info({ textLength: result.text.length }, 'Voice transcribed');

  return result.text;
}
