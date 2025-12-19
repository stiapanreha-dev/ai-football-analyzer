import type { Language } from '@archetypes/shared';

import { ru, type Messages } from './ru.js';
import { en } from './en.js';
import { es } from './es.js';
import { fr } from './fr.js';
import { pt } from './pt.js';
import { el } from './el.js';
import { sr } from './sr.js';
import { no } from './no.js';

const messages: Record<Language, Messages> = {
  ru,
  en,
  es,
  fr,
  pt,
  el,
  sr,
  no,
};

export function getMessages(language: Language): Messages {
  return messages[language] ?? en;
}

export type { Messages };
