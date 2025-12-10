import type { Language, ArchetypeCode } from '@archetypes/shared';
import { ARCHETYPES } from '@archetypes/shared';

export interface ClarificationContext {
  language: Language;
  situation: string;
  previousAnswer: string;
  targetArchetype: ArchetypeCode;
}

export function buildClarificationPrompt(context: ClarificationContext): string {
  const archetype = ARCHETYPES[context.targetArchetype];
  const languageInstruction = getLanguageInstruction(context.language);

  return `Ты - эксперт по психологии футболистов. Сформулируй уточняющий вопрос для выявления архетипа "${archetype.name}".

АРХЕТИП ДЛЯ ВЫЯВЛЕНИЯ:
${archetype.name}: ${archetype.description}
Пример поведения: ${archetype.behaviorExample}

ОРИГИНАЛЬНАЯ СИТУАЦИЯ:
"${context.situation}"

ОТВЕТ ИГРОКА:
"${context.previousAnswer}"

ЗАДАЧА:
Создай короткий (1-2 предложения) уточняющий вопрос, который поможет понять, насколько выражен архетип "${archetype.name}" у игрока.

ТРЕБОВАНИЯ:
1. Вопрос должен быть естественным продолжением разговора
2. Не упоминай термины "архетип", "тест" и т.д.
3. Вопрос должен провоцировать конкретный ответ
4. ${languageInstruction}

ФОРМАТ ОТВЕТА:
Верни только текст вопроса, без пояснений.`;
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
