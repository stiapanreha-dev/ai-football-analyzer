/**
 * Лимиты и пороговые значения системы
 */

// Сессия тестирования
export const MIN_SITUATIONS = 1;
export const MAX_SITUATIONS = 1;
export const TOP_DOMINANT_ARCHETYPES = 2; // Количество доминирующих архетипов для исключения из clarification
export const MAX_CLARIFICATIONS = 3; // Максимальное количество уточнений (самые слабые архетипы)

// Голосовые сообщения
export const VOICE_MIN_DURATION_SEC = 3;
export const VOICE_MAX_DURATION_SEC = 120;

// Текстовые ответы
export const TEXT_MIN_LENGTH = 20; // Минимальная длина текстового ответа

// PIN-коды
export const PIN_CODE_LENGTH = 6;
export const MAX_PIN_ATTEMPTS = 3;
export const DEFAULT_SESSION_PIN_HOURS = 24;

// Оценки архетипов
export const SCORE_MIN = 0;
export const SCORE_MAX = 10;

// Пороги силы архетипа
export const STRENGTH_THRESHOLDS = {
  dominant: 8.0, // >= 8
  moderate: 5.0, // 5-7.9
  weak: 2.0, // 2-4.9
  absent: 0, // < 2
} as const;

// Порог подтверждения близости к архетипу в clarification
// Если score >= этого значения, архетип считается подтверждённым и удаляется из списка
export const CLARIFICATION_CONFIRMATION_THRESHOLD = 5;

// Веса для расчёта финальных скоров
export const ANSWER_WEIGHTS = {
  main: 1.5,
  clarification: 1.0,
} as const;

// Распределение контекстов ситуаций
export const CONTEXT_WEIGHTS = {
  pressure: 0.25, // Давление (важные моменты)
  conflict: 0.2, // Конфликт (с партнёром, соперником)
  leadership: 0.15, // Лидерство (организация)
  tactical: 0.15, // Тактика (решения)
  emotional: 0.15, // Эмоции (после гола, ошибки)
  failure: 0.1, // Неудача (как реагирует)
} as const;

// Пагинация
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
