import { config } from '../config.js';
import { logger } from '../middleware/logging.js';

export interface AuditLogEntry {
  action: string;
  telegramId?: bigint | number | undefined;
  playerId?: number | undefined;
  sessionId?: string | undefined;
  data?: Record<string, unknown> | undefined;
  success?: boolean | undefined;
  errorMsg?: string | undefined;
}

/**
 * Сервис аудит-логирования
 * Записывает все действия бота в базу данных
 */
class AuditService {
  private queue: AuditLogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly flushInterval = 1000; // 1 секунда
  private readonly maxQueueSize = 50;

  /**
   * Записать событие в аудит-лог
   */
  async log(entry: AuditLogEntry): Promise<void> {
    // Добавляем в очередь
    this.queue.push(entry);

    // Если очередь большая - сразу отправляем
    if (this.queue.length >= this.maxQueueSize) {
      await this.flush();
    } else if (!this.flushTimer) {
      // Иначе планируем отправку
      this.flushTimer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  /**
   * Отправить все записи из очереди
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.queue.length === 0) return;

    const entries = [...this.queue];
    this.queue = [];

    // Отправляем каждую запись (можно оптимизировать batch-запросом)
    for (const entry of entries) {
      try {
        await this.sendToBackend(entry);
      } catch (error) {
        // Логируем ошибку но не падаем
        logger.error({ error, entry }, 'Failed to send audit log');
      }
    }
  }

  private async sendToBackend(entry: AuditLogEntry): Promise<void> {
    const url = `${config.apiUrl}/api/v1/audit`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'bot',
        action: entry.action,
        telegramId: entry.telegramId ? Number(entry.telegramId) : undefined,
        playerId: entry.playerId,
        sessionId: entry.sessionId,
        data: entry.data,
        success: entry.success ?? true,
        errorMsg: entry.errorMsg,
      }),
    });

    if (!response.ok) {
      throw new Error(`Audit API error: ${response.status}`);
    }
  }
}

export const audit = new AuditService();

// Типы действий для удобства
export const AuditAction = {
  // Команды
  START_COMMAND: 'start_command',
  HELP_COMMAND: 'help_command',
  LANGUAGE_COMMAND: 'language_command',
  CANCEL_COMMAND: 'cancel_command',

  // PIN
  START_TEST_CLICKED: 'start_test_clicked',
  PIN_ENTERED: 'pin_entered',
  PIN_VALIDATED: 'pin_validated',
  PIN_INVALID: 'pin_invalid',
  PIN_EXPIRED: 'pin_expired',
  PIN_EXHAUSTED: 'pin_exhausted',

  // Регистрация
  REGISTRATION_STARTED: 'registration_started',
  REGISTRATION_NAME_ENTERED: 'registration_name_entered',
  REGISTRATION_POSITION_SELECTED: 'registration_position_selected',
  REGISTRATION_COMPLETED: 'registration_completed',

  // Сессия
  SESSION_STARTED: 'session_started',
  SESSION_CREATED: 'session_created',
  SESSION_RESUMED: 'session_resumed',
  SITUATION_RECEIVED: 'situation_received',
  ANSWER_SUBMITTED: 'answer_submitted',
  ANSWER_IRRELEVANT: 'answer_irrelevant',
  CLARIFICATION_SUBMITTED: 'clarification_submitted',
  SESSION_COMPLETED: 'session_completed',
  SESSION_ABANDONED: 'session_abandoned',

  // Голосовые сообщения
  VOICE_RECEIVED: 'voice_received',
  VOICE_TRANSCRIBED: 'voice_transcribed',
  VOICE_TRANSCRIPTION_FAILED: 'voice_transcription_failed',

  // Flow
  CONTINUE_FLOW_CLICKED: 'continue_flow_clicked',
  LANGUAGE_CHANGED: 'language_changed',

  // Ошибки
  ERROR: 'error',
  API_ERROR: 'api_error',
} as const;
