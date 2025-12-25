import type { FastifyInstance } from 'fastify';
import type { PromptDto, PromptKey, TestPromptResultDto } from '@archetypes/shared';
import { PROMPT_KEYS, ARCHETYPES } from '@archetypes/shared';

import { complete } from '../../services/llm/openai.provider.js';
import { NotFoundError } from '../../utils/errors.js';

// Описания архетипов для подстановки в плейсхолдеры
const ARCHETYPE_DESCRIPTIONS = Object.values(ARCHETYPES)
  .map((a) => `- ${a.name} (${a.code}): ${a.description}`)
  .join('\n');

const ARCHETYPE_DETAILS = Object.values(ARCHETYPES)
  .map((a) => `- ${a.name} (${a.code}): ${a.description}\n  Пример поведения: ${a.behaviorExample}`)
  .join('\n\n');

// Тестовые данные для предпросмотра промптов
const TEST_DATA: Record<string, string> = {
  '{{ARCHETYPE_DESCRIPTIONS}}': ARCHETYPE_DESCRIPTIONS,
  '{{ARCHETYPE_DETAILS}}': ARCHETYPE_DETAILS,
  '{{CONTEXT_TYPE}}': 'момент высокого давления (пенальти, последние минуты, важный матч)',
  '{{PLAYER_POSITION}}': 'Игрок играет на позиции: midfielder.',
  '{{PREVIOUS_SITUATIONS}}': '',
  '{{PENDING_ARCHETYPES}}': '',
  '{{LANGUAGE_INSTRUCTION}}': 'Напиши на русском языке',
  '{{SITUATION}}': '85-я минута, счёт 1:1. Ваш партнёр по команде потерял мяч в центре поля, соперник идёт в быструю контратаку. Вы единственный защитник между нападающим соперника и воротами.',
  '{{ANSWER}}': 'Я бы пошёл в жёсткую стыковую борьбу, попытался бы отобрать мяч или хотя бы задержать атаку, чтобы партнёры успели вернуться.',
  '{{ARCHETYPE_NAME}}': 'Лидер',
  '{{ARCHETYPE_DESCRIPTION}}': 'Берёт ответственность, управляет, организует, регулирует команду.',
  '{{ARCHETYPE_BEHAVIOR}}': 'В этой ситуации Лидер взял бы на себя инициативу, собрал команду и чётко сказал, что делать дальше.',
  '{{PLAYER_INFO}}': 'Имя игрока: Иван Петров',
  '{{POSITION_INFO}}': 'midfielder',
  '{{SCORES}}': `Лидер: 7.5 (moderate)
Воин: 8.2 (dominant)
Стратег: 6.0 (moderate)
Дипломат: 4.5 (weak)
Исполнитель: 5.5 (moderate)
Индивидуалист: 3.0 (weak)
Избегающий: 1.5 (absent)`,
  '{{TEAM_NAME}}': 'ФК Тестовая Команда',
  '{{PLAYERS_PROFILES}}': `- Иван Петров (midfielder): доминирующий архетип "Воин", баллы: Воин: 8.2, Лидер: 7.5, Стратег: 6.0
- Алексей Сидоров (defender): доминирующий архетип "Исполнитель", баллы: Исполнитель: 8.0, Стратег: 7.0, Дипломат: 6.5
- Михаил Козлов (forward): доминирующий архетип "Индивидуалист", баллы: Индивидуалист: 7.5, Воин: 7.0, Лидер: 5.5`,
  '{{TEAM_AVERAGE_SCORES}}': `- Лидер: 6.2 (1 доминант.)
- Воин: 7.4 (1 доминант.)
- Стратег: 6.3 (0 доминант.)
- Дипломат: 5.0 (0 доминант.)
- Исполнитель: 6.8 (1 доминант.)
- Индивидуалист: 5.5 (1 доминант.)
- Избегающий: 2.1 (0 доминант.)`,
};

export class PromptService {
  constructor(private readonly app: FastifyInstance) {}

  /**
   * Получение всех промптов
   */
  async findAll(): Promise<PromptDto[]> {
    const settings = await this.app.prisma.settings.findMany({
      where: {
        key: { in: [...PROMPT_KEYS] },
      },
      orderBy: { key: 'asc' },
    });

    return settings.map((s) => ({
      key: s.key as PromptKey,
      value: s.value,
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  /**
   * Получение промпта по ключу
   */
  async findByKey(key: PromptKey): Promise<PromptDto> {
    const setting = await this.app.prisma.settings.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundError('Prompt', key);
    }

    return {
      key: setting.key as PromptKey,
      value: setting.value,
      updatedAt: setting.updatedAt.toISOString(),
    };
  }

  /**
   * Обновление промпта
   */
  async update(key: PromptKey, value: string): Promise<PromptDto> {
    const setting = await this.app.prisma.settings.update({
      where: { key },
      data: { value },
    });

    return {
      key: setting.key as PromptKey,
      value: setting.value,
      updatedAt: setting.updatedAt.toISOString(),
    };
  }

  /**
   * Тестирование промпта с подстановкой тестовых данных
   */
  async test(key: PromptKey, template: string): Promise<TestPromptResultDto> {
    // Заменяем все плейсхолдеры на тестовые данные
    let prompt = template;
    for (const [placeholder, value] of Object.entries(TEST_DATA)) {
      prompt = prompt.replaceAll(placeholder, value);
    }

    // Определяем temperature в зависимости от типа промпта
    const temperatureMap: Record<PromptKey, number> = {
      prompt_situation: 0.8,
      prompt_analysis: 0.3,
      prompt_clarification: 0.7,
      prompt_alternative_response: 0.7,
      prompt_player_report: 0.6,
      prompt_coach_report: 0.4,
      prompt_tactical_analysis: 0.5,
    };

    const temperature = temperatureMap[key];
    const result = await complete(prompt, { temperature, maxTokens: 1500 });

    return {
      result: result.trim(),
    };
  }
}

export function createPromptService(app: FastifyInstance): PromptService {
  return new PromptService(app);
}
