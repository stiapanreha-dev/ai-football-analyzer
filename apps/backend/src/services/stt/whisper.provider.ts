import OpenAI from 'openai';

import { config } from '../../config.js';
import { STTError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

/**
 * Транскрибация аудио через OpenAI Whisper API
 */
export async function transcribe(
  audioBuffer: Buffer,
  mimeType: string,
  language?: string
): Promise<TranscriptionResult> {
  try {
    // Определяем расширение по MIME type
    const ext = getExtensionFromMimeType(mimeType);
    const filename = `audio.${ext}`;

    // Создаём File объект для OpenAI SDK
    const file = new File([new Uint8Array(audioBuffer)], filename, { type: mimeType });

    const response = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      language: language, // Опционально подсказываем язык
      response_format: 'verbose_json',
    });

    logger.info(
      { language: response.language, duration: response.duration },
      'Audio transcribed successfully'
    );

    return {
      text: response.text,
      language: response.language,
      duration: response.duration,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to transcribe audio');

    if (error instanceof OpenAI.APIError) {
      throw new STTError(`Whisper API error: ${error.message}`, {
        status: error.status,
        code: error.code,
      });
    }

    throw new STTError('Failed to transcribe audio', error);
  }
}

function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/x-m4a': 'm4a',
    'audio/m4a': 'm4a',
    'audio/flac': 'flac',
  };

  return mimeToExt[mimeType] ?? 'ogg';
}
