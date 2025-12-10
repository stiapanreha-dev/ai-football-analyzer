import type { Language } from '@archetypes/shared';

import { ru, type Messages } from './ru.js';
import { en } from './en.js';

const messages: Record<Language, Messages> = {
  ru,
  en,
  // Для остальных языков используем английский как fallback
  es: en,
  fr: en,
  pt: en,
  el: en,
  sr: en,
  no: en,
};

export function getMessages(language: Language): Messages {
  return messages[language] ?? en;
}

export type { Messages };
