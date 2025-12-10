import { ARCHETYPES } from '@archetypes/shared';
import type { ArchetypeScoreDto } from '@archetypes/shared';

const ARCHETYPE_DETAILS = Object.values(ARCHETYPES)
  .map(
    (a) =>
      `- ${a.name} (${a.code}): ${a.description}\n  Пример поведения: ${a.behaviorExample}`
  )
  .join('\n\n');

export interface ReportContext {
  playerName?: string;
  playerPosition?: string;
  scores: ArchetypeScoreDto[];
}

export function buildPlayerReportPrompt(context: ReportContext): string {
  const scoresText = context.scores
    .map((s) => `${s.archetypeName}: ${s.finalScore.toFixed(1)} (${s.strength})`)
    .join('\n');

  const playerInfo = context.playerName
    ? `Имя игрока: ${context.playerName}`
    : 'Игрок (имя не указано)';
  const positionInfo = context.playerPosition ? `\nПозиция: ${context.playerPosition}` : '';

  return `Ты - спортивный психолог. Напиши краткую характеристику футболиста для самого игрока.

${playerInfo}${positionInfo}

РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ (оценки по архетипам 0-10):
${scoresText}

АРХЕТИПЫ:
${ARCHETYPE_DETAILS}

ЗАДАЧА:
Напиши текст характеристики (3-5 абзацев) для самого игрока.

ТРЕБОВАНИЯ:
1. Пиши на русском языке
2. Обращайся к игроку на "ты"
3. Начни с сильных сторон
4. Дай практические советы по развитию
5. Избегай негативных формулировок
6. Не используй слово "архетип"

ФОРМАТ:
Верни только текст характеристики, без заголовков и пояснений.`;
}

export function buildCoachReportPrompt(context: ReportContext): string {
  const scoresText = context.scores
    .map((s) => `${s.archetypeName} (${s.archetypeCode}): ${s.finalScore.toFixed(1)} (${s.strength})`)
    .join('\n');

  const playerInfo = context.playerName ?? 'Игрок';
  const positionInfo = context.playerPosition ?? 'не указана';

  return `Ты - спортивный психолог. Подготовь аналитический отчёт для тренера о футболисте.

ИГРОК: ${playerInfo}
ПОЗИЦИЯ: ${positionInfo}

РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:
${scoresText}

АРХЕТИПЫ:
${ARCHETYPE_DETAILS}

ЗАДАЧА:
Подготовь структурированный отчёт для тренера.

ФОРМАТ ОТВЕТА (строго JSON):
{
  "summary": "общее резюме (2-3 предложения)",
  "strengths": ["сильная сторона 1", "сильная сторона 2", ...],
  "weaknesses": ["слабая сторона 1", "слабая сторона 2", ...],
  "bestSituations": ["ситуация, где игрок эффективен 1", "ситуация 2", ...],
  "riskSituations": ["ситуация риска 1", "ситуация риска 2", ...],
  "compatibility": {
    "worksWith": ["тип игрока, с которым хорошо взаимодействует 1", ...],
    "conflictsWith": ["тип игрока, с которым могут быть конфликты 1", ...]
  },
  "recommendations": ["рекомендация тренеру 1", "рекомендация 2", ...]
}

ВСЕ ТЕКСТЫ НА РУССКОМ ЯЗЫКЕ!`;
}

export interface CoachReportResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  bestSituations: string[];
  riskSituations: string[];
  compatibility: {
    worksWith: string[];
    conflictsWith: string[];
  };
  recommendations: string[];
}

export function parseCoachReportResponse(response: string): CoachReportResult {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse coach report: no JSON found');
  }

  return JSON.parse(jsonMatch[0]) as CoachReportResult;
}
