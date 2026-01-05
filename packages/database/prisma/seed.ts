import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const archetypes = [
  {
    code: 'leader',
    name: 'Лидер',
    description: 'Берёт ответственность, управляет, организует, регулирует команду.',
    behaviorExample:
      'В этой ситуации Лидер взял бы на себя инициативу, собрал команду и чётко сказал, что делать дальше.',
    orderNum: 1,
  },
  {
    code: 'warrior',
    name: 'Воин',
    description: 'Силовая игра, борьба, напор, эмоциональная мобилизация.',
    behaviorExample:
      'Воин бы усилил давление, пошёл в жёсткую борьбу и зарядил команду своей энергией.',
    orderNum: 2,
  },
  {
    code: 'strategist',
    name: 'Стратег',
    description: 'Аналитическое мышление, расчёт, чтение игры, поиск оптимальных решений.',
    behaviorExample:
      'Стратег бы остановился, оценил ситуацию, нашёл слабое место соперника и предложил план.',
    orderNum: 3,
  },
  {
    code: 'diplomat',
    name: 'Дипломат',
    description: 'Спокойствие, урегулирование конфликта, сохранение атмосферы.',
    behaviorExample:
      'Дипломат бы успокоил эмоции в команде, нашёл компромисс и восстановил рабочую атмосферу.',
    orderNum: 4,
  },
  {
    code: 'executor',
    name: 'Исполнитель',
    description: 'Дисциплина, надёжность, выполнение задач, стабильность.',
    behaviorExample:
      'Исполнитель бы чётко выполнил указания тренера, сосредоточившись на своей зоне ответственности.',
    orderNum: 5,
  },
  {
    code: 'individualist',
    name: 'Индивидуалист',
    description: 'Фокус на себе, самостоятельные решения, игра ради результата или эффектности.',
    behaviorExample: 'Индивидуалист бы взял игру на себя, попытался решить эпизод единолично.',
    orderNum: 6,
  },
  {
    code: 'avoider',
    name: 'Избегающий',
    description: 'Уход от ответственности, минимизация риска, перекладывание решений.',
    behaviorExample:
      'Избегающий бы отдал мяч партнёру, ушёл от принятия решения, переложил ответственность.',
    orderNum: 7,
  },
];

const defaultSettings = [
  { key: 'min_situations', value: '4' },
  { key: 'max_situations', value: '6' },
  { key: 'clarification_threshold', value: '3.0' },
  { key: 'coach_password_hash', value: '' },
  { key: 'llm_provider', value: 'claude' },
  { key: 'stt_provider', value: 'whisper' },
];

// =============================================================================
// Prompt Templates
// =============================================================================

const promptTemplates = [
  {
    key: 'prompt_situation',
    value: `Ты - эксперт по психологии футболистов. Создай реалистичную игровую ситуацию для психологического тестирования.

АРХЕТИПЫ ИГРОКОВ:
{{ARCHETYPE_DESCRIPTIONS}}

ЗАДАЧА:
Создай короткую (2-4 предложения) игровую ситуацию типа: {{CONTEXT_TYPE}}
{{PLAYER_POSITION}}
{{PREVIOUS_SITUATIONS}}
{{PENDING_ARCHETYPES}}

ТРЕБОВАНИЯ К СИТУАЦИИ:
1. Ситуация должна быть реалистичной и понятной любому футболисту
2. Должна провоцировать эмоциональную реакцию
3. Не должна иметь очевидно "правильного" ответа
4. Должна позволять проявить разные архетипы поведения
5. {{LANGUAGE_INSTRUCTION}}

ФОРМАТ ОТВЕТА:
Верни только текст ситуации, без пояснений и комментариев.`,
  },
  {
    key: 'prompt_analysis',
    value: `Ты - эксперт по психологии футболистов. Проанализируй ответ игрока на игровую ситуацию.

АРХЕТИПЫ ИГРОКОВ:
{{ARCHETYPE_DETAILS}}

СИТУАЦИЯ:
"{{SITUATION}}"

ОТВЕТ ИГРОКА:
"{{ANSWER}}"

═══════════════════════════════════════════════════════════════════
ВАЖНО! СНАЧАЛА ПРОВЕРЬ РЕЛЕВАНТНОСТЬ ОТВЕТА (ДО АНАЛИЗА АРХЕТИПОВ):
═══════════════════════════════════════════════════════════════════

ПРИМЕРЫ НЕРЕЛЕВАНТНЫХ ОТВЕТОВ (isIrrelevant: true, все скоры = 0):
- "Нрникииаарарисиотд" — бессмысленный набор букв
- "Аа как как ааа пеин порт" — бессвязные слова
- "Привет", "Тест", "Раз два три" — не ответ на ситуацию
- "123456", "asdfgh", "йцукен" — случайные символы
- "Не знаю", "Пропустить", "Ничего" — уклонение от ответа
- Любой текст без связи с футболом или описанной ситуацией
- Повторение слов/слогов без смысла

КРИТЕРИИ РЕЛЕВАНТНОГО ОТВЕТА:
- Описывает конкретное действие или решение
- Содержит осмысленные предложения на человеческом языке
- Логически связан с футболом, командой или игровой ситуацией

ЕСЛИ ОТВЕТ НЕРЕЛЕВАНТНЫЙ — НЕМЕДЛЕННО ВЕРНИ:
{
  "scores": {"leader":0,"warrior":0,"strategist":0,"diplomat":0,"executor":0,"individualist":0,"avoider":0},
  "reasoning": "Ответ нерелевантен",
  "dominantArchetype": "avoider",
  "weakestArchetype": "leader",
  "isIrrelevant": true,
  "irrelevantReason": "краткое объяснение почему ответ нерелевантен"
}

═══════════════════════════════════════════════════════════════════
ЕСЛИ ОТВЕТ РЕЛЕВАНТНЫЙ — АНАЛИЗИРУЙ АРХЕТИПЫ:
═══════════════════════════════════════════════════════════════════

КРИТЕРИИ ОЦЕНКИ:
- 8-10: Архетип ярко выражен в ответе
- 5-7: Архетип умеренно присутствует
- 2-4: Архетип слабо выражен
- 0-1: Архетип отсутствует

ПРАВИЛА АНАЛИЗА:
1. Анализируй только содержание ответа, не домысливай
2. Один ответ может показывать несколько архетипов

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
  "isIrrelevant": false,
  "irrelevantReason": null
}`,
  },
  {
    key: 'prompt_clarification',
    value: `Ты - эксперт по психологии футболистов. Сформулируй уточняющий вопрос для выявления архетипа "{{ARCHETYPE_NAME}}".

АРХЕТИП ДЛЯ ВЫЯВЛЕНИЯ:
{{ARCHETYPE_NAME}}: {{ARCHETYPE_DESCRIPTION}}
Пример поведения: {{ARCHETYPE_BEHAVIOR}}

ОРИГИНАЛЬНАЯ СИТУАЦИЯ:
"{{SITUATION}}"

ОТВЕТ ИГРОКА:
"{{ANSWER}}"

ЗАДАЧА:
Создай короткий (1-2 предложения) уточняющий вопрос, который поможет понять, насколько выражен архетип "{{ARCHETYPE_NAME}}" у игрока.

ТРЕБОВАНИЯ:
1. Вопрос должен быть естественным продолжением разговора
2. Не упоминай термины "архетип", "тест" и т.д.
3. Вопрос должен провоцировать конкретный ответ
4. {{LANGUAGE_INSTRUCTION}}

ФОРМАТ ОТВЕТА:
Верни только текст вопроса, без пояснений.`,
  },
  {
    key: 'prompt_alternative_response',
    value: `Ты - эксперт по психологии футболистов. Сгенерируй альтернативный ответ на игровую ситуацию от имени игрока с ярко выраженным архетипом "{{ARCHETYPE_NAME}}".

АРХЕТИП:
{{ARCHETYPE_NAME}}: {{ARCHETYPE_DESCRIPTION}}
Пример поведения: {{ARCHETYPE_BEHAVIOR}}

СИТУАЦИЯ:
"{{SITUATION}}"

{{PLAYER_POSITION}}

ЗАДАЧА:
Напиши короткий ответ (2-3 предложения) от первого лица, как бы поступил игрок с ярко выраженным архетипом "{{ARCHETYPE_NAME}}" в этой ситуации.

ТРЕБОВАНИЯ:
1. Ответ должен быть конкретным и описывать действия
2. Используй "я" и "мы" как будто отвечает сам игрок
3. Покажи характерное поведение данного архетипа
4. Не упоминай термины "архетип", "тест" и т.д.
5. Ответ должен звучать естественно, как реальный ответ футболиста
6. {{LANGUAGE_INSTRUCTION}}

ФОРМАТ ОТВЕТА:
Верни только текст ответа от первого лица, без пояснений и кавычек.`,
  },
  {
    key: 'prompt_player_report',
    value: `Ты - спортивный психолог. Напиши краткую характеристику футболиста для самого игрока.

{{PLAYER_INFO}}

РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ (оценки по архетипам 0-10):
{{SCORES}}

АРХЕТИПЫ:
{{ARCHETYPE_DETAILS}}

ЗАДАЧА:
Напиши текст характеристики (3-5 абзацев) для самого игрока.

ТРЕБОВАНИЯ:
1. {{LANGUAGE_INSTRUCTION}}
2. Обращайся к игроку на "ты" (или аналог в выбранном языке)
3. Начни с сильных сторон
4. Дай практические советы по развитию
5. Избегай негативных формулировок
6. Не используй слово "архетип"

ФОРМАТ:
Верни только текст характеристики, без заголовков и пояснений.`,
  },
  {
    key: 'prompt_coach_report',
    value: `Ты - спортивный психолог. Подготовь аналитический отчёт для тренера о футболисте.

ИГРОК: {{PLAYER_INFO}}
ПОЗИЦИЯ: {{POSITION_INFO}}

РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:
{{SCORES}}

АРХЕТИПЫ:
{{ARCHETYPE_DETAILS}}

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
    "leader": 75,
    "warrior": 60,
    "strategist": 85,
    "diplomat": 90,
    "executor": 70,
    "individualist": 40,
    "avoider": 30
  },
  "recommendedPositions": [
    {"position": "defender", "suitability": 85, "reasoning": "почему подходит эта позиция"},
    {"position": "midfielder", "suitability": 70, "reasoning": "почему подходит эта позиция"}
  ],
  "recommendations": ["рекомендация тренеру 1", "рекомендация 2", ...],
  "psychologicalPlan": ["пункт плана работы для психологической службы 1", "пункт 2", ...]
}

ВАЖНО ДЛЯ COMPATIBILITY:
- Укажи процент совместимости (0-100) с игроками каждого из 7 архетипов
- Высокий процент (70-100) = хорошая совместимость
- Средний процент (40-69) = нейтральная совместимость
- Низкий процент (0-39) = возможны конфликты

ВАЖНО ДЛЯ RECOMMENDED_POSITIONS:
- Укажи 2-3 наиболее подходящие позиции на основе психологического профиля
- Позиции: goalkeeper, defender, midfielder, forward, staff
- suitability: процент подходящести 0-100
- reasoning: краткое обоснование (1-2 предложения)
- Сортируй по убыванию suitability

ВАЖНО ДЛЯ PSYCHOLOGICAL_PLAN:
- Составь план работы для психологической службы (4-6 пунктов)
- Каждый пункт — конкретное направление работы с игроком
- Цель: помочь игроку максимально раскрыть свой потенциал согласно профилю
- Включи работу над слабыми сторонами и усиление сильных
- Укажи конкретные техники, упражнения или подходы

ВСЕ ТЕКСТЫ НА РУССКОМ ЯЗЫКЕ!`,
  },
  {
    key: 'prompt_tactical_analysis',
    value: `Ты - тактический аналитик футбола и спортивный психолог. Проанализируй психологический профиль команды.

СТИЛЬ ОТВЕТА:
- Пиши ТЕЗИСНО. Короткие утверждения без воды.
- Формулировки РЕЗКИЕ и КАТЕГОРИЧНЫЕ.
- Никаких "возможно", "скорее всего", "может быть".
- Каждый тезис — конкретный факт или рекомендация.

КОМАНДА: {{TEAM_NAME}}

ИГРОКИ И ИХ АРХЕТИПЫ:
{{PLAYERS_PROFILES}}

СРЕДНИЙ ПРОФИЛЬ КОМАНДЫ (баллы 0-10):
{{TEAM_AVERAGE_SCORES}}

АРХЕТИПЫ:
{{ARCHETYPE_DETAILS}}

ТАКТИЧЕСКИЕ МОДЕЛИ:
1. high_press — высокий прессинг, gegenpressing
2. reactive — низкий блок, контратаки
3. positional — контроль мяча, позиционная дисциплина
4. direct — вертикальный футбол, минимум пасов
5. adaptive — гибридный, смена стиля по ходу матча

СОВМЕСТИМОСТЬ АРХЕТИПОВ С ТАКТИКАМИ:
- high_press: идеально Воин, Лидер, Исполнитель; плохо Избегающий, Индивидуалист
- reactive: идеально Исполнитель, Стратег, Дипломат; плохо Индивидуалист
- positional: идеально Стратег, Дипломат, Исполнитель; плохо Воин
- direct: идеально Воин, Индивидуалист, Лидер; плохо Стратег
- adaptive: требует баланс всех, особенно Стратег + Лидер + Дипломат

ЗАДАЧА: Выдай ПОЛНЫЙ анализ команды по всем 9 разделам.

ФОРМАТ ОТВЕТА (строго JSON):
{
  "overallAssessment": "2-3 тезиса об общем профиле команды",
  "dominantArchetypes": ["код1", "код2"],
  "weakArchetypes": ["код1", "код2"],
  "recommendations": [
    {
      "style": "high_press",
      "styleName": "Агрессивно-прессинговый",
      "suitability": 85,
      "reasoning": "почему подходит/не подходит",
      "pros": ["плюс 1", "плюс 2"],
      "cons": ["минус 1", "минус 2"],
      "keyPlayers": ["Имя - роль"]
    }
  ],
  "extendedAnalysis": {
    "deficits": {
      "deficits": [
        {
          "archetypeCode": "код",
          "archetypeName": "название",
          "averageScore": 3.5,
          "gameRisks": ["риск 1", "риск 2"],
          "psychologicalRisks": ["риск 1"],
          "tacticalRisks": ["риск 1"],
          "criticalPhases": ["фаза 1"],
          "isCritical": true
        }
      ],
      "missingPlayerTypes": ["тип игрока 1", "тип 2"],
      "transferHypotheses": ["гипотеза 1", "гипотеза 2"]
    },
    "developmentPotential": {
      "archetypes": [
        {
          "archetypeCode": "код",
          "archetypeName": "название",
          "isDevelopable": true,
          "developmentMethods": ["метод 1", "метод 2"],
          "limitations": ["ограничение 1"]
        }
      ],
      "developRecommendations": ["что развивать 1", "что 2"],
      "compensateRecommendations": ["что компенсировать трансферами"]
    },
    "tacticalVulnerabilities": {
      "vulnerabilities": [
        {
          "imbalance": "описание перекоса",
          "dangerousOpponents": ["тип соперника 1"],
          "riskScenarios": ["сценарий 1"],
          "compensation": ["как компенсировать"]
        }
      ],
      "dangerousMatchups": ["против кого опасно играть"]
    },
    "roleDistribution": {
      "lineDistribution": [
        {
          "line": "defense",
          "lineName": "Оборона",
          "dominantArchetypes": ["архетип 1"],
          "gaps": ["вакуум 1"],
          "overloads": ["перегрузка 1"]
        },
        {
          "line": "midfield",
          "lineName": "Полузащита",
          "dominantArchetypes": ["архетип 1"],
          "gaps": [],
          "overloads": []
        },
        {
          "line": "attack",
          "lineName": "Атака",
          "dominantArchetypes": ["архетип 1"],
          "gaps": [],
          "overloads": []
        }
      ],
      "combinations": [
        {
          "archetypes": ["архетип 1", "архетип 2"],
          "effect": "synergy",
          "description": "почему работает/конфликтует"
        }
      ],
      "roleRecommendations": ["рекомендация 1"]
    },
    "substitutionStrategy": {
      "scenarios": [
        {
          "scenario": "hold_lead",
          "scenarioName": "Удержание счёта",
          "neededArchetypes": ["архетип 1"],
          "optimalTiming": "60-70 минута",
          "playerRecommendations": ["игрок 1"]
        },
        {
          "scenario": "increase_pressure",
          "scenarioName": "Усиление давления",
          "neededArchetypes": ["архетип 1"],
          "optimalTiming": "55-65 минута",
          "playerRecommendations": ["игрок 1"]
        },
        {
          "scenario": "break_low_block",
          "scenarioName": "Взлом низкого блока",
          "neededArchetypes": ["архетип 1"],
          "optimalTiming": "60-75 минута",
          "playerRecommendations": ["игрок 1"]
        },
        {
          "scenario": "stabilize_after_goal",
          "scenarioName": "Стабилизация после гола",
          "neededArchetypes": ["архетип 1"],
          "optimalTiming": "сразу после пропущенного",
          "playerRecommendations": ["игрок 1"]
        }
      ],
      "generalRecommendations": ["общая рекомендация 1"]
    },
    "trainingProcess": {
      "archetypeProfiles": [
        {
          "archetypeCode": "код",
          "archetypeName": "название",
          "effectiveExercises": ["упражнение 1"],
          "frustratingFormats": ["формат 1"]
        }
      ],
      "balanceRecommendations": ["баланс структуры и свободы"],
      "underdevelopedArchetypeExercises": ["упражнение для недопредставленных"]
    },
    "additionalData": {
      "behavioralMetrics": ["метрика 1"],
      "contextualMetrics": ["метрика 1"],
      "psychologicalMetrics": ["метрика 1"],
      "dynamicTrackingMetrics": ["метрика 1"],
      "keyGameEvents": ["событие 1"],
      "minimalMetricsSet": ["минимум 1"],
      "extendedMetricsSet": ["расширенная 1"]
    },
    "transferStrategy": {
      "priorityArchetypes": ["архетип для усиления"],
      "transferTargets": [
        {
          "position": "позиция",
          "neededArchetypes": ["архетип 1"],
          "idealCombination": "идеальная комбинация",
          "risks": ["риск 1"]
        }
      ],
      "foreignPlayerRequirements": ["требование к легионерам"]
    },
    "coachCompatibility": {
      "idealCoachType": "тип тренера",
      "conflictingCoachTypes": ["конфликтующий тип"],
      "coachChangeRisks": ["риск смены тренера"],
      "coachTypes": [
        {
          "coachType": "Авторитарный",
          "compatibility": "high",
          "reasoning": "почему"
        },
        {
          "coachType": "Демократичный",
          "compatibility": "medium",
          "reasoning": "почему"
        },
        {
          "coachType": "Либеральный",
          "compatibility": "low",
          "reasoning": "почему"
        }
      ]
    }
  }
}

ВАЖНО:
- Оцени ВСЕ 5 тактических моделей в recommendations
- suitability: 0-100 процентов
- Сортируй recommendations по убыванию suitability
- В deficits: только архетипы с averageScore < 5.0
- В developmentPotential: ВСЕ 7 архетипов
- В roleDistribution: ВСЕ 3 линии (defense, midfield, attack)
- В substitutionStrategy: ВСЕ 4 сценария
- Формулировки РЕЗКИЕ, без воды

ВСЕ ТЕКСТЫ НА РУССКОМ ЯЗЫКЕ!`,
  },
];

async function main(): Promise<void> {
  console.log('Seeding database...');

  // Seed archetypes
  console.log('Seeding archetypes...');
  for (const archetype of archetypes) {
    await prisma.archetype.upsert({
      where: { code: archetype.code },
      update: archetype,
      create: archetype,
    });
  }
  console.log(`Seeded ${archetypes.length} archetypes`);

  // Seed settings
  console.log('Seeding settings...');
  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {}, // Don't update existing values
      create: setting,
    });
  }
  console.log(`Seeded ${defaultSettings.length} settings`);

  // Seed prompt templates
  console.log('Seeding prompt templates...');
  for (const prompt of promptTemplates) {
    await prisma.settings.upsert({
      where: { key: prompt.key },
      update: {}, // Don't update existing values (preserve user edits)
      create: prompt,
    });
  }
  console.log(`Seeded ${promptTemplates.length} prompt templates`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
