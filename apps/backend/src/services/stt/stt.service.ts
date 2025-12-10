import { transcribe, type TranscriptionResult } from './whisper.provider.js';

export class SttService {
  /**
   * Транскрибация аудио файла
   */
  async transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    language?: string
  ): Promise<TranscriptionResult> {
    return transcribe(audioBuffer, mimeType, language);
  }
}

export function createSttService(): SttService {
  return new SttService();
}
