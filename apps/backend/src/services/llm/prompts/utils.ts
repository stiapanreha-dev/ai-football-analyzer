import type { Language } from '@archetypes/shared';
import type { PlayerPosition } from '@archetypes/database';

/**
 * Подстановка плейсхолдеров в шаблон промпта
 * Заменяет {{KEY}} на соответствующее значение из context
 */
export function replacePlaceholders(
  template: string,
  context: Record<string, string>
): string {
  return Object.entries(context).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value),
    template
  );
}

/**
 * Получить инструкцию по языку для промпта
 */
export function getLanguageInstruction(language: Language): string {
  const instructions: Record<Language, string> = {
    ru: 'Напиши на русском языке',
    en: 'Write in English',
    es: 'Escribe en español',
    fr: 'Écris en français',
    pt: 'Escreve em português',
    el: 'Γράψε στα ελληνικά',
    sr: 'Пиши на српском',
    no: 'Skriv på norsk',
  };
  return instructions[language];
}

/**
 * Получить название позиции на нужном языке
 */
export function getPositionName(position: PlayerPosition, language: Language): string {
  const positions: Record<PlayerPosition, Record<Language, string>> = {
    goalkeeper: {
      ru: 'вратарь',
      en: 'goalkeeper',
      es: 'portero',
      fr: 'gardien',
      pt: 'goleiro',
      el: 'τερματοφύλακας',
      sr: 'голман',
      no: 'keeper',
    },
    defender: {
      ru: 'защитник',
      en: 'defender',
      es: 'defensor',
      fr: 'défenseur',
      pt: 'defensor',
      el: 'αμυντικός',
      sr: 'одбрамбени',
      no: 'forsvarer',
    },
    midfielder: {
      ru: 'полузащитник',
      en: 'midfielder',
      es: 'mediocampista',
      fr: 'milieu',
      pt: 'meio-campista',
      el: 'μέσος',
      sr: 'везни',
      no: 'midtbanespiller',
    },
    forward: {
      ru: 'нападающий',
      en: 'forward',
      es: 'delantero',
      fr: 'attaquant',
      pt: 'atacante',
      el: 'επιθετικός',
      sr: 'нападач',
      no: 'angriper',
    },
  };
  const positionTranslations = positions[position];
  return positionTranslations?.[language] ?? position;
}
