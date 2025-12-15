import type { PlayerPosition } from '@archetypes/database';
import type { Language, ArchetypeCode } from '@archetypes/shared';
import { ARCHETYPES } from '@archetypes/shared';

export interface AlternativeResponseContext {
  language: Language;
  situation: string;
  targetArchetype: ArchetypeCode;
  playerPosition?: PlayerPosition;
}

export function buildAlternativeResponsePrompt(context: AlternativeResponseContext): string {
  const archetype = ARCHETYPES[context.targetArchetype];
  const languageInstruction = getLanguageInstruction(context.language);
  const positionHint = context.playerPosition
    ? `Игрок играет на позиции: ${getPositionName(context.playerPosition, context.language)}.`
    : '';

  return `Ты - эксперт по психологии футболистов. Сгенерируй альтернативный ответ на игровую ситуацию от имени игрока с ярко выраженным архетипом "${archetype.name}".

АРХЕТИП:
${archetype.name}: ${archetype.description}
Пример поведения: ${archetype.behaviorExample}

СИТУАЦИЯ:
"${context.situation}"

${positionHint}

ЗАДАЧА:
Напиши короткий ответ (2-3 предложения) от первого лица, как бы поступил игрок с ярко выраженным архетипом "${archetype.name}" в этой ситуации.

ТРЕБОВАНИЯ:
1. Ответ должен быть конкретным и описывать действия
2. Используй "я" и "мы" как будто отвечает сам игрок
3. Покажи характерное поведение данного архетипа
4. Не упоминай термины "архетип", "тест" и т.д.
5. Ответ должен звучать естественно, как реальный ответ футболиста
6. ${languageInstruction}

ФОРМАТ ОТВЕТА:
Верни только текст ответа от первого лица, без пояснений и кавычек.`;
}

function getLanguageInstruction(language: Language): string {
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

function getPositionName(position: PlayerPosition, language: Language): string {
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
