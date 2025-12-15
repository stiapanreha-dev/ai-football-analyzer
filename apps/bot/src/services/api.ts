import type {
  ApiResponse,
  ValidatePinResultDto,
  PlayerDto,
  PlayerWithStatsDto,
  SessionDto,
  SituationDto,
  SubmitAnswerResultDto,
  SessionResultDto,
} from '@archetypes/shared';

import { config } from '../config.js';
import { logger } from '../middleware/logging.js';

class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${config.apiUrl}/api/v1${path}`;

  logger.debug({ method, url, body }, 'API request');

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };
  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  const data = (await response.json()) as ApiResponse<T> | { success: false; error: { code: string; message: string } };

  if (!response.ok || !data.success) {
    const error = 'error' in data ? data.error : { code: 'UNKNOWN', message: 'Unknown error' };
    logger.error({ url, statusCode: response.status, error }, 'API error');
    throw new ApiError(error.message, error.code, response.status);
  }

  return (data as ApiResponse<T>).data;
}

export const api = {
  // PIN
  async validatePin(code: string, telegramId: bigint): Promise<ValidatePinResultDto> {
    return request('POST', '/pins/validate', {
      code,
      telegramId: Number(telegramId),
    });
  },

  // Players
  async getPlayerByTelegramId(telegramId: bigint): Promise<PlayerWithStatsDto | null> {
    try {
      return await request('GET', `/players/telegram/${telegramId}`);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  async updatePlayer(
    telegramId: bigint,
    data: { name?: string; position?: string; jerseyNumber?: number }
  ): Promise<PlayerDto> {
    return request('PATCH', `/players/telegram/${telegramId}`, data);
  },

  // Sessions
  async createSession(playerId: number, language: string): Promise<SessionDto> {
    return request('POST', '/sessions', { playerId, language });
  },

  async getActiveSession(playerId: number): Promise<SessionDto | null> {
    return request('GET', `/sessions/player/${playerId}/active`);
  },

  async getSession(sessionId: string): Promise<SessionDto> {
    return request('GET', `/sessions/${sessionId}`);
  },

  async getCurrentSituation(sessionId: string): Promise<SituationDto | null> {
    return request('GET', `/sessions/${sessionId}/situation`);
  },

  async submitAnswer(sessionId: string, text: string): Promise<SubmitAnswerResultDto> {
    return request('POST', `/sessions/${sessionId}/answer`, { text });
  },

  async submitClarification(
    sessionId: string,
    archetypeCode: string,
    text: string
  ): Promise<SubmitAnswerResultDto> {
    return request('POST', `/sessions/${sessionId}/clarification`, {
      archetypeCode,
      text,
    });
  },

  async completeSession(sessionId: string): Promise<void> {
    return request('POST', `/sessions/${sessionId}/complete`);
  },

  async abandonSession(sessionId: string): Promise<void> {
    return request('POST', `/sessions/${sessionId}/abandon`);
  },

  // Reports
  async getSessionResult(sessionId: string): Promise<SessionResultDto | null> {
    return request('GET', `/reports/session/${sessionId}/result`);
  },

  // STT
  async transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string,
    language?: string
  ): Promise<{ text: string }> {
    const url = `${config.apiUrl}/api/v1/stt/transcribe`;

    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: mimeType }), 'audio.ogg');
    if (language) {
      formData.append('language', language);
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = (await response.json()) as { success: boolean; data?: { text: string }; error?: { code: string; message: string } };

    if (!response.ok || !data.success) {
      throw new ApiError(data.error?.message ?? 'STT error', data.error?.code ?? 'STT_ERROR', response.status);
    }

    return data.data as { text: string };
  },
};

export { ApiError };
