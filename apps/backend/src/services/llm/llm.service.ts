import { complete } from './openai.provider.js';
import {
  buildSituationPrompt,
  buildAnalysisPrompt,
  parseAnalysisResponse,
  buildClarificationPrompt,
  buildAlternativeResponsePrompt,
  buildPlayerReportPrompt,
  buildCoachReportPrompt,
  parseCoachReportResponse,
  type SituationContext,
  type AnalysisResult,
  type ClarificationContext,
  type AlternativeResponseContext,
  type ReportContext,
  type CoachReportResult,
} from './prompts/index.js';

export class LlmService {
  /**
   * Генерация игровой ситуации
   */
  async generateSituation(context: SituationContext): Promise<string> {
    const prompt = buildSituationPrompt(context);
    const response = await complete(prompt, { temperature: 0.8 });
    return response.trim();
  }

  /**
   * Анализ ответа игрока
   */
  async analyzeAnswer(situation: string, answer: string): Promise<AnalysisResult> {
    const prompt = buildAnalysisPrompt({ situation, answer });
    const response = await complete(prompt, { temperature: 0.3 });
    return parseAnalysisResponse(response);
  }

  /**
   * Генерация уточняющего вопроса (deprecated, используйте generateAlternativeResponse)
   */
  async generateClarification(context: ClarificationContext): Promise<string> {
    const prompt = buildClarificationPrompt(context);
    const response = await complete(prompt, { temperature: 0.7 });
    return response.trim();
  }

  /**
   * Генерация альтернативного ответа от имени архетипа
   */
  async generateAlternativeResponse(context: AlternativeResponseContext): Promise<string> {
    const prompt = buildAlternativeResponsePrompt(context);
    const response = await complete(prompt, { temperature: 0.7 });
    return response.trim();
  }

  /**
   * Генерация отчёта для игрока
   */
  async generatePlayerReport(context: ReportContext): Promise<string> {
    const prompt = buildPlayerReportPrompt(context);
    const response = await complete(prompt, { temperature: 0.6, maxTokens: 1500 });
    return response.trim();
  }

  /**
   * Генерация отчёта для тренера
   */
  async generateCoachReport(context: ReportContext): Promise<CoachReportResult> {
    const prompt = buildCoachReportPrompt(context);
    const response = await complete(prompt, { temperature: 0.4, maxTokens: 2000 });
    return parseCoachReportResponse(response);
  }
}

export function createLlmService(): LlmService {
  return new LlmService();
}
