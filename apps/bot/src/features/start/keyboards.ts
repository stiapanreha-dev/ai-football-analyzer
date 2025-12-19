import { InlineKeyboard } from 'grammy';

import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, LANGUAGE_FLAGS, type Language } from '@archetypes/shared';

import type { Messages } from '../../locales/index.js';

export function createMainKeyboard(messages: Messages): InlineKeyboard {
  return new InlineKeyboard()
    .text(messages.keyboards.startTest, 'start_test')
    .row()
    .text(messages.keyboards.changeLanguage, 'change_language');
}

export function createLanguageKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  const languages = SUPPORTED_LANGUAGES.slice();
  const rows = 2;
  const perRow = Math.ceil(languages.length / rows);

  for (let i = 0; i < languages.length; i++) {
    const lang = languages[i] as Language;
    keyboard.text(`${LANGUAGE_FLAGS[lang]} ${LANGUAGE_NAMES[lang]}`, `lang_${lang}`);

    if ((i + 1) % perRow === 0 && i < languages.length - 1) {
      keyboard.row();
    }
  }

  return keyboard;
}

export function createPositionKeyboard(messages: Messages): InlineKeyboard {
  return new InlineKeyboard()
    .text(messages.registration.positions.goalkeeper, 'position_goalkeeper')
    .text(messages.registration.positions.defender, 'position_defender')
    .row()
    .text(messages.registration.positions.midfielder, 'position_midfielder')
    .text(messages.registration.positions.forward, 'position_forward');
}

export function createCancelKeyboard(messages: Messages): InlineKeyboard {
  return new InlineKeyboard().text(messages.keyboards.cancel, 'cancel');
}

export function createContinueKeyboard(messages: Messages): InlineKeyboard {
  return new InlineKeyboard().text(messages.keyboards.continue, 'continue_flow');
}
