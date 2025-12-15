import { ARCHETYPES } from '@archetypes/shared';
import type { ArchetypeCode } from '@archetypes/shared';

const ARCHETYPE_DETAILS = Object.values(ARCHETYPES)
  .map(
    (a) =>
      `- ${a.name} (${a.code}): ${a.description}\n  Пример поведения: ${a.behaviorExample}`
  )
  .join('\n\n');

export interface AnalysisContext {
  situation: string;
  answer: string;
}

export interface AnalysisResult {
  scores: Record<ArchetypeCode, number>;
  reasoning: string;
  dominantArchetype: ArchetypeCode;
  weakestArchetype: ArchetypeCode;
  isIrrelevant: boolean;
  irrelevantReason?: string;
}

export function buildAnalysisPrompt(context: AnalysisContext): string {
  return `Ты - эксперт по психологии футболистов. Проанализируй ответ игрока на игровую ситуацию и определи выраженность каждого архетипа.

АРХЕТИПЫ ИГРОКОВ:
${ARCHETYPE_DETAILS}

СИТУАЦИЯ:
"${context.situation}"

ОТВЕТ ИГРОКА:
"${context.answer}"

ЗАДАЧА:
Проанализируй ответ и оцени выраженность каждого архетипа по шкале 0-10.

КРИТЕРИИ ОЦЕНКИ:
- 8-10: Архетип ярко выражен в ответе
- 5-7: Архетип умеренно присутствует
- 2-4: Архетип слабо выражен
- 0-1: Архетип отсутствует

ПРАВИЛА:
1. Анализируй только содержание ответа, не домысливай
2. Один ответ может показывать несколько архетипов
3. Если ответ НЕ относится к ситуации (другая тема, бессмыслица, тест микрофона, приветствие, просто слова/числа без смысла) - отметь isIrrelevant: true
4. При isIrrelevant: true - выставь все скоры в 0 и укажи причину в irrelevantReason

ФОРМАТ ОТВЕТА (строго JSON):
{
  "scores": {
    "leader": число от 0 до 10,
    "warrior": число от 0 до 10,
    "strategist": число от 0 до 10,
    "diplomat": число от 0 до 10,
    "executor": число от 0 до 10,
    "individualist": число от 0 до 10,
    "avoider": число от 0 до 10
  },
  "reasoning": "краткое объяснение оценок на русском языке",
  "dominantArchetype": "код наиболее выраженного архетипа",
  "weakestArchetype": "код наименее выраженного архетипа",
  "isIrrelevant": true/false,
  "irrelevantReason": "причина нерелевантности или null"
}`;
}

export function parseAnalysisResponse(response: string): AnalysisResult {
  // Извлекаем JSON из ответа
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse analysis response: no JSON found');
  }

  const parsed = JSON.parse(jsonMatch[0]) as AnalysisResult;

  // Гарантируем наличие isIrrelevant (default: false)
  if (typeof parsed.isIrrelevant !== 'boolean') {
    parsed.isIrrelevant = false;
  }

  // Валидируем scores
  const validArchetypes: ArchetypeCode[] = [
    'leader',
    'warrior',
    'strategist',
    'diplomat',
    'executor',
    'individualist',
    'avoider',
  ];

  for (const code of validArchetypes) {
    if (typeof parsed.scores[code] !== 'number' || parsed.scores[code] < 0 || parsed.scores[code] > 10) {
      parsed.scores[code] = parsed.isIrrelevant ? 0 : 5; // 0 для нерелевантных, 5 для остальных
    }
  }

  return parsed;
}
