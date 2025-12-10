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
    value: `Ты - эксперт по психологии футболистов. Проанализируй ответ игрока на игровую ситуацию и определи выраженность каждого архетипа.

АРХЕТИПЫ ИГРОКОВ:
{{ARCHETYPE_DETAILS}}

СИТУАЦИЯ:
"{{SITUATION}}"

ОТВЕТ ИГРОКА:
"{{ANSWER}}"

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
3. Если ответ неоднозначный - отметь needsClarification: true
4. Если архетип требует уточнения - укажи его в clarificationArchetype
5. Если ответ НЕ относится к ситуации (другая тема, бессмыслица, тест микрофона, приветствие, просто слова/числа без смысла) - отметь isIrrelevant: true
6. При isIrrelevant: true - выставь все скоры в 0 и укажи причину в irrelevantReason

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
  "needsClarification": true/false,
  "clarificationArchetype": "код архетипа для уточнения или null",
  "isIrrelevant": true/false,
  "irrelevantReason": "причина нерелевантности или null"
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
    "worksWith": ["тип игрока, с которым хорошо взаимодействует 1", ...],
    "conflictsWith": ["тип игрока, с которым могут быть конфликты 1", ...]
  },
  "recommendations": ["рекомендация тренеру 1", "рекомендация 2", ...]
}

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
