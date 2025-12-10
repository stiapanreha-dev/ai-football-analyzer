import type { Language, ArchetypeCode } from '@archetypes/shared';
import { ARCHETYPES } from '@archetypes/shared';

export interface SituationContext {
  language: Language;
  contextType: 'pressure' | 'conflict' | 'leadership' | 'tactical' | 'emotional' | 'failure';
  playerPosition?: string;
  previousSituations?: string[];
  pendingArchetypes?: ArchetypeCode[];
}

const CONTEXT_DESCRIPTIONS: Record<SituationContext['contextType'], string> = {
  pressure: 'момент высокого давления (пенальти, последние минуты, важный матч)',
  conflict: 'конфликтная ситуация (с партнёром по команде, соперником, судьёй)',
  leadership: 'ситуация, требующая организации и лидерства',
  tactical: 'тактическое решение в игре',
  emotional: 'эмоциональный момент (после гола, ошибки, несправедливости)',
  failure: 'ситуация неудачи или поражения',
};

const ARCHETYPE_DESCRIPTIONS = Object.values(ARCHETYPES)
  .map((a) => `- ${a.name} (${a.code}): ${a.description}`)
  .join('\n');

export function buildSituationPrompt(context: SituationContext): string {
  const languageInstruction = getLanguageInstruction(context.language);
  const contextDesc = CONTEXT_DESCRIPTIONS[context.contextType];
  const positionNote = context.playerPosition
    ? `Игрок играет на позиции: ${context.playerPosition}.`
    : '';
  const previousNote = context.previousSituations?.length
    ? `\nНе повторяй эти ситуации:\n${context.previousSituations.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    : '';

  const pendingNote = context.pendingArchetypes?.length
    ? `\nСоздай ситуацию, которая поможет выявить следующие архетипы: ${context.pendingArchetypes.map((code) => ARCHETYPES[code].name).join(', ')}`
    : '';

  return `Ты - эксперт по психологии футболистов. Создай реалистичную игровую ситуацию для психологического тестирования.

АРХЕТИПЫ ИГРОКОВ:
${ARCHETYPE_DESCRIPTIONS}

ЗАДАЧА:
Создай короткую (2-4 предложения) игровую ситуацию типа: ${contextDesc}
${positionNote}
${previousNote}
${pendingNote}

ТРЕБОВАНИЯ К СИТУАЦИИ:
1. Ситуация должна быть реалистичной и понятной любому футболисту
2. Должна провоцировать эмоциональную реакцию
3. Не должна иметь очевидно "правильного" ответа
4. Должна позволять проявить разные архетипы поведения
5. ${languageInstruction}

ФОРМАТ ОТВЕТА:
Верни только текст ситуации, без пояснений и комментариев.`;
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
