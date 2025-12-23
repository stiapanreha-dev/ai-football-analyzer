import type { MyContext } from '../utils/context.js';
import { api } from './api.js';
import { logger } from '../middleware/logging.js';
import { config } from '../config.js';

// Таймаут для скачивания файлов из Telegram
const DOWNLOAD_TIMEOUT = 60_000; // 60 сек

/**
 * Fetch с таймаутом для предотвращения зависания
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Download timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Скачивание файла из Telegram
 */
async function downloadFile(fileId: string, botToken: string): Promise<Buffer> {
  // Получаем путь к файлу
  const fileInfoUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
  const fileInfoResponse = await fetchWithTimeout(fileInfoUrl, DOWNLOAD_TIMEOUT);
  const fileInfo = (await fileInfoResponse.json()) as { ok: boolean; result: { file_path: string } };

  if (!fileInfo.ok) {
    throw new Error('Failed to get file info');
  }

  // Скачиваем файл
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.result.file_path}`;
  const fileResponse = await fetchWithTimeout(fileUrl, DOWNLOAD_TIMEOUT);

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
