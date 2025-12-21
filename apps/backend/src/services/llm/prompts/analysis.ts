import type { ArchetypeCode } from '@archetypes/shared';

export interface AnalysisResult {
  scores: Record<ArchetypeCode, number>;
  reasoning: string;
  dominantArchetype: ArchetypeCode;
  weakestArchetype: ArchetypeCode;
  isIrrelevant: boolean;
  irrelevantReason?: string;
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
