/**
 * Поддерживаемые языки для опроса игроков
 * Отчёт всегда генерируется на русском
 */

export const SUPPORTED_LANGUAGES = ['ru', 'en', 'es', 'fr', 'pt', 'el', 'sr', 'no'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'ru';

export const LANGUAGE_NAMES: Record<Language, string> = {
  ru: 'Русский',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  el: 'Ελληνικά',
  sr: 'Српски',
  no: 'Norsk',
};

export const LANGUAGE_FLAGS: Record<Language, string> = {
  ru: '🇷🇺',
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  pt: '🇵🇹',
  el: '🇬🇷',
  sr: '🇷🇸',
  no: '🇳🇴',
};

/**
 * Проверить, является ли строка поддерживаемым языком
 */
export function isValidLanguage(value: string): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

/**
 * Получить название языка с флагом
 */
export function getLanguageLabel(lang: Language): string {
  return `${LANGUAGE_FLAGS[lang]} ${LANGUAGE_NAMES[lang]}`;
}
