import type { FastifyInstance } from 'fastify';
import type { PromptKey, Language, ArchetypeCode, ArchetypeScoreDto } from '@archetypes/shared';
import type { PlayerPosition } from '@archetypes/database';
import { ARCHETYPES } from '@archetypes/shared';
import { complete } from './openai.provider.js';
import {
  replacePlaceholders,
  getLanguageInstruction,
  getPositionName,
} from './prompts/utils.js';
import {
  parseAnalysisResponse,
  parseCoachReportResponse,
  type AnalysisResult,
  type CoachReportResult,
} from './prompts/index.js';

// Описания архетипов для промптов
const ARCHETYPE_DESCRIPTIONS = Object.values(ARCHETYPES)
  .map((a) => `- ${a.name} (${a.code}): ${a.description}`)
  .join('\n');

const ARCHETYPE_DETAILS = Object.values(ARCHETYPES)
  .map(
    (a) =>
      `- ${a.name} (${a.code}): ${a.description}\n  Пример поведения: ${a.behaviorExample}`
  )
  .join('\n\n');

// Описания типов контекста ситуаций
const CONTEXT_DESCRIPTIONS: Record<string, string> = {
  pressure: 'момент высокого давления (пенальти, последние минуты, важный матч)',
  conflict: 'конфликтная ситуация (с партнёром по команде, соперником, судьёй)',
  leadership: 'ситуация, требующая организации и лидерства',
  tactical: 'тактическое решение в игре',
  emotional: 'эмоциональный момент (после гола, ошибки, несправедливости)',
  failure: 'ситуация неудачи или поражения',
};

// Интерфейсы контекстов
export interface SituationContext {
  language: Language;
  contextType: 'pressure' | 'conflict' | 'leadership' | 'tactical' | 'emotional' | 'failure';
  playerPosition?: string;
  previousSituations?: string[];
  pendingArchetypes?: ArchetypeCode[];
}

export interface ClarificationContext {
  language: Language;
  situation: string;
  previousAnswer: string;
  targetArchetype: ArchetypeCode;
}

export interface AlternativeResponseContext {
  language: Language;
  situation: string;
  targetArchetype: ArchetypeCode;
  playerPosition?: PlayerPosition;
}

export interface ReportContext {
  playerName?: string;
  playerPosition?: string;
  scores: ArchetypeScoreDto[];
  language?: Language;
}

export class LlmService {
  constructor(private app: FastifyInstance) {}

  /**
   * Получить шаблон промпта из БД
   */
  private async getPromptTemplate(key: PromptKey): Promise<string> {
    const setting = await this.app.prisma.settings.findUnique({
      where: { key },
    });
    if (!setting) {
      throw new Error(`Prompt template not found: ${key}`);
    }
    return setting.value;
  }

  /**
   * Генерация игровой ситуации
   */
  async generateSituation(context: SituationContext): Promise<string> {
    const template = await this.getPromptTemplate('prompt_situation');

    const positionNote = context.playerPosition
      ? `Игрок играет на позиции: ${context.playerPosition}.`
      : '';

    const previousNote = context.previousSituations?.length
      ? `\nНе повторяй эти ситуации:\n${context.previousSituations.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : '';

    const pendingNote = context.pendingArchetypes?.length
      ? `\nСоздай ситуацию, которая поможет выявить следующие архетипы: ${context.pendingArchetypes.map((code) => ARCHETYPES[code].name).join(', ')}`
      : '';

    const prompt = replacePlaceholders(template, {
      ARCHETYPE_DESCRIPTIONS,
      CONTEXT_TYPE: CONTEXT_DESCRIPTIONS[context.contextType] ?? context.contextType,
      PLAYER_POSITION: positionNote,
      PREVIOUS_SITUATIONS: previousNote,
      PENDING_ARCHETYPES: pendingNote,
      LANGUAGE_INSTRUCTION: getLanguageInstruction(context.language),
    });

    const response = await complete(prompt, { temperature: 0.8 });
    return response.trim();
  }

  /**
   * Анализ ответа игрока
   */
  async analyzeAnswer(situation: string, answer: string): Promise<AnalysisResult> {
    const template = await this.getPromptTemplate('prompt_analysis');

    const prompt = replacePlaceholders(template, {
      ARCHETYPE_DETAILS,
      SITUATION: situation,
      ANSWER: answer,
    });

    const response = await complete(prompt, { temperature: 0.3 });
    return parseAnalysisResponse(response);
  }

  /**
   * Генерация уточняющего вопроса (deprecated, используйте generateAlternativeResponse)
   */
  async generateClarification(context: ClarificationContext): Promise<string> {
    const template = await this.getPromptTemplate('prompt_clarification');
    const archetype = ARCHETYPES[context.targetArchetype];

    const prompt = replacePlaceholders(template, {
      ARCHETYPE_NAME: archetype.name,
      ARCHETYPE_DESCRIPTION: archetype.description,
      ARCHETYPE_BEHAVIOR: archetype.behaviorExample,
      SITUATION: context.situation,
      ANSWER: context.previousAnswer,
      LANGUAGE_INSTRUCTION: getLanguageInstruction(context.language),
    });

    const response = await complete(prompt, { temperature: 0.7 });
    return response.trim();
  }

  /**
   * Генерация альтернативного ответа от имени архетипа
   */
  async generateAlternativeResponse(context: AlternativeResponseContext): Promise<string> {
    const template = await this.getPromptTemplate('prompt_alternative_response');
    const archetype = ARCHETYPES[context.targetArchetype];

    const positionHint = context.playerPosition
      ? `Игрок играет на позиции: ${getPositionName(context.playerPosition, context.language)}.`
      : '';

    const prompt = replacePlaceholders(template, {
      ARCHETYPE_NAME: archetype.name,
      ARCHETYPE_DESCRIPTION: archetype.description,
      ARCHETYPE_BEHAVIOR: archetype.behaviorExample,
      SITUATION: context.situation,
      PLAYER_POSITION: positionHint,
      LANGUAGE_INSTRUCTION: getLanguageInstruction(context.language),
    });

    const response = await complete(prompt, { temperature: 0.7 });
    return response.trim();
  }

  /**
   * Генерация отчёта для игрока
   */
  async generatePlayerReport(context: ReportContext): Promise<string> {
    const template = await this.getPromptTemplate('prompt_player_report');

    const scoresText = context.scores
      .map((s) => `${s.archetypeName}: ${s.finalScore.toFixed(1)} (${s.strength})`)
      .join('\n');

    const playerInfo = context.playerName
      ? `Имя игрока: ${context.playerName}${context.playerPosition ? `\nПозиция: ${context.playerPosition}` : ''}`
      : `Игрок (имя не указано)${context.playerPosition ? `\nПозиция: ${context.playerPosition}` : ''}`;

    const prompt = replacePlaceholders(template, {
      PLAYER_INFO: playerInfo,
      SCORES: scoresText,
      ARCHETYPE_DETAILS,
      LANGUAGE_INSTRUCTION: getLanguageInstruction(context.language ?? 'ru'),
    });

    const response = await complete(prompt, { temperature: 0.6, maxTokens: 1500 });
    return response.trim();
  }

  /**
   * Генерация отчёта для тренера
   */
  async generateCoachReport(context: ReportContext): Promise<CoachReportResult> {
    const template = await this.getPromptTemplate('prompt_coach_report');

    const scoresText = context.scores
      .map((s) => `${s.archetypeName} (${s.archetypeCode}): ${s.finalScore.toFixed(1)} (${s.strength})`)
      .join('\n');

    const prompt = replacePlaceholders(template, {
      PLAYER_INFO: context.playerName ?? 'Игрок',
      POSITION_INFO: context.playerPosition ?? 'не указана',
      SCORES: scoresText,
      ARCHETYPE_DETAILS,
    });

    const response = await complete(prompt, { temperature: 0.4, maxTokens: 2000 });
    return parseCoachReportResponse(response);
  }
}

export function createLlmService(app: FastifyInstance): LlmService {
  return new LlmService(app);
}

// Re-export types for backwards compatibility
export type { AnalysisResult, CoachReportResult };
