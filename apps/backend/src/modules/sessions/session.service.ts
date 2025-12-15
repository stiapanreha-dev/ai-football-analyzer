import type { FastifyInstance } from 'fastify';
import type { Session, SessionStatus, Situation, PlayerPosition } from '@archetypes/database';

import type {
  SessionDto,
  SessionWithDetailsDto,
  SituationDto,
  SubmitAnswerResultDto,
  SubmitClarificationResultDto,
  AlternativeResponseDto,
  PaginatedResponse,
  Language,
  ArchetypeCode,
} from '@archetypes/shared';
import { MAX_SITUATIONS, TOP_DOMINANT_ARCHETYPES } from '@archetypes/shared';

import {
  NotFoundError,
  ValidationError,
  SessionNotFoundError,
  SessionAlreadyCompletedError,
  SessionInvalidStateError,
} from '../../utils/errors.js';

import type { StartSessionInput, GetSessionsQuery, SubmitClarificationInput } from './session.schemas.js';
import { createLlmService, type LlmService } from '../../services/llm/llm.service.js';

// Типы контекста для ситуаций
const CONTEXT_TYPES: Array<'pressure' | 'conflict' | 'leadership' | 'tactical' | 'emotional' | 'failure'> = [
  'pressure',
  'conflict',
  'leadership',
  'tactical',
  'emotional',
  'failure',
];

export class SessionService {
  private readonly llmService: LlmService;

  constructor(private readonly app: FastifyInstance) {
    this.llmService = createLlmService();
  }

  /**
   * Создание новой сессии
   */
  async create(data: StartSessionInput): Promise<SessionDto> {
    // Проверяем существование игрока
    const player = await this.app.prisma.player.findUnique({
      where: { id: data.playerId },
    });

    if (!player) {
      throw new NotFoundError('Player', data.playerId);
    }

    const session = await this.app.prisma.session.create({
      data: {
        playerId: data.playerId,
        language: data.language,
        status: 'created',
        phase: 'intro',
      },
    });

    return this.toDto(session);
  }

  /**
   * Получение активной (незавершённой) сессии игрока
   */
  async getActiveSession(playerId: number): Promise<SessionDto | null> {
    const session = await this.app.prisma.session.findFirst({
      where: {
        playerId,
        status: {
          in: ['created', 'in_progress', 'clarifying'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return session ? this.toDto(session) : null;
  }

  /**
   * Получение списка сессий
   */
  async findAll(query: GetSessionsQuery): Promise<PaginatedResponse<SessionWithDetailsDto>> {
    const { page, pageSize, playerId, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * pageSize;

    const where: { playerId?: number; status?: SessionStatus } = {};
    if (playerId) where.playerId = playerId;
    if (status) where.status = status;

    const [sessions, total] = await Promise.all([
      this.app.prisma.session.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          player: true,
          _count: {
            select: {
              situations: true,
            },
          },
          situations: {
            include: {
              _count: {
                select: { answers: true },
              },
            },
          },
        },
      }),
      this.app.prisma.session.count({ where }),
    ]);

    const items = sessions.map((s) => this.toWithDetailsDto(s));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Получение сессии по ID
   */
  async findById(id: string): Promise<SessionWithDetailsDto> {
    const session = await this.app.prisma.session.findUnique({
      where: { id },
      include: {
        player: true,
        _count: {
          select: {
            situations: true,
          },
        },
        situations: {
          include: {
            _count: {
              select: { answers: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new SessionNotFoundError(id);
    }

    return this.toWithDetailsDto(session);
  }

  /**
   * Получение текущей/следующей ситуации
   */
  async getCurrentSituation(sessionId: string): Promise<SituationDto | null> {
    const session = await this.app.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        player: true,
        situations: {
          orderBy: { orderNum: 'asc' },
          select: { content: true },
        },
      },
    });

    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    if (session.status === 'completed' || session.status === 'abandoned') {
      throw new SessionAlreadyCompletedError(sessionId);
    }

    // Получаем текущую ситуацию по индексу
    let situation = await this.app.prisma.situation.findFirst({
      where: {
        sessionId,
        orderNum: session.situationIndex,
      },
    });

    if (!situation) {
      // Генерируем новую ситуацию через LLM
      const contextType = CONTEXT_TYPES[session.situationIndex % CONTEXT_TYPES.length] ?? 'pressure';
      const previousSituations = session.situations.map((s) => s.content);

      // Конвертируем pendingArchetypes (ID) в коды архетипов
      let pendingArchetypeCodes: ArchetypeCode[] | undefined = undefined;
      if (session.pendingArchetypes.length > 0) {
        const archetypes = await this.app.prisma.archetype.findMany({
          where: { id: { in: session.pendingArchetypes } },
          select: { code: true },
        });
        pendingArchetypeCodes = archetypes.map((a) => a.code as ArchetypeCode);
      }

      const content = await this.llmService.generateSituation({
        language: session.language as Language,
        contextType,
        playerPosition: session.player.position ?? undefined,
        previousSituations,
        pendingArchetypes: pendingArchetypeCodes,
      });

      situation = await this.app.prisma.situation.create({
        data: {
          sessionId,
          orderNum: session.situationIndex,
          content,
          contextType,
        },
      });

      // Обновляем статус и фазу сессии
      await this.app.prisma.session.update({
        where: { id: sessionId },
        data: {
          status: 'in_progress',
          phase: 'situation',
          startedAt: session.startedAt ?? new Date(),
        },
      });
    }

    return this.situationToDto(situation);
  }

  /**
   * Отправка ответа на ситуацию
   */
  async submitAnswer(sessionId: string, text: string): Promise<SubmitAnswerResultDto> {
    const session = await this.app.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        situations: {
          orderBy: { orderNum: 'asc' },
        },
      },
    });

    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    if (session.status === 'completed' || session.status === 'abandoned') {
      throw new SessionAlreadyCompletedError(sessionId);
    }

    // Получаем текущую ситуацию
    const currentSituation = await this.app.prisma.situation.findFirst({
      where: {
        sessionId,
        orderNum: session.situationIndex,
      },
    });

    if (!currentSituation) {
      throw new SessionInvalidStateError(sessionId, 'has situation', 'no situation');
    }

    // Анализируем ответ через LLM
    const analysis = await this.llmService.analyzeAnswer(currentSituation.content, text);

    // Если ответ нерелевантный - не сохраняем, возвращаем сразу
    if (analysis.isIrrelevant) {
      return {
        answerId: 0,
        scores: analysis.scores,
        unpresentArchetypes: [],
        isSessionComplete: false,
        isIrrelevant: true,
        irrelevantReason: analysis.irrelevantReason,
      };
    }

    // Создаём ответ с результатами анализа
    const answer = await this.app.prisma.answer.create({
      data: {
        situationId: currentSituation.id,
        type: 'main',
        text,
        analysisJson: JSON.parse(JSON.stringify(analysis)),
      },
    });

    // Получаем архетипы для сохранения скоров
    const archetypes = await this.app.prisma.archetype.findMany();
    const archetypeMap = new Map(archetypes.map((a) => [a.code, a.id]));

    // Сохраняем скоры по каждому архетипу
    await this.app.prisma.answerScore.createMany({
      data: Object.entries(analysis.scores).map(([code, score]) => ({
        answerId: answer.id,
        archetypeId: archetypeMap.get(code)!,
        score,
        confidence: 1.0,
      })),
    });

    // Определяем доминирующие архетипы (топ N по score) и непроявленные
    const sortedScores = Object.entries(analysis.scores)
      .sort(([, a], [, b]) => b - a);
    const unpresentArchetypes = sortedScores
      .slice(TOP_DOMINANT_ARCHETYPES)
      .map(([code]) => code as ArchetypeCode);

    // Сохраняем ID непроявленных архетипов в сессии для последующих clarification
    const unpresentArchetypeIds = unpresentArchetypes
      .map((code) => archetypeMap.get(code))
      .filter((id): id is number => id !== undefined);

    // Обновляем сессию - переходим в фазу clarification
    await this.app.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'clarifying',
        phase: 'clarification',
        pendingArchetypes: unpresentArchetypeIds,
      },
    });

    // Определяем, будет ли это последняя ситуация
    const nextSituationIndex = session.situationIndex + 1;
    const isSessionComplete = nextSituationIndex >= MAX_SITUATIONS;

    return {
      answerId: answer.id,
      scores: analysis.scores,
      unpresentArchetypes,
      isSessionComplete,
    };
  }

  /**
   * Получение альтернативного ответа от имени архетипа
   */
  async getAlternativeResponse(
    sessionId: string,
    archetypeCode: ArchetypeCode
  ): Promise<AlternativeResponseDto> {
    const session = await this.app.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        player: true,
      },
    });

    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    // Получаем текущую ситуацию
    const currentSituation = await this.app.prisma.situation.findFirst({
      where: {
        sessionId,
        orderNum: session.situationIndex,
      },
    });

    if (!currentSituation) {
      throw new SessionInvalidStateError(sessionId, 'has situation', 'no situation');
    }

    // Получаем архетип для названия
    const archetype = await this.app.prisma.archetype.findFirst({
      where: { code: archetypeCode },
    });

    if (!archetype) {
      throw new ValidationError(`Unknown archetype code: ${archetypeCode}`);
    }

    // Генерируем альтернативный ответ через LLM
    const alternativeResponse = await this.llmService.generateAlternativeResponse({
      language: session.language as Language,
      situation: currentSituation.content,
      targetArchetype: archetypeCode,
      playerPosition: session.player.position as PlayerPosition | undefined,
    });

    return {
      alternativeResponse,
      archetypeCode,
      archetypeName: archetype.name,
    };
  }

  /**
   * Отправка уточняющего ответа (комментарий к альтернативному ответу)
   */
  async submitClarification(
    sessionId: string,
    data: SubmitClarificationInput
  ): Promise<SubmitClarificationResultDto> {
    const session = await this.app.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    if (session.status !== 'clarifying') {
      throw new SessionInvalidStateError(sessionId, 'clarifying', session.status);
    }

    // Получаем текущую ситуацию
    const currentSituation = await this.app.prisma.situation.findFirst({
      where: {
        sessionId,
        orderNum: session.situationIndex,
      },
    });

    if (!currentSituation) {
      throw new SessionInvalidStateError(sessionId, 'has situation', 'no situation');
    }

    // Анализируем комментарий через LLM
    const analysis = await this.llmService.analyzeAnswer(currentSituation.content, data.text);

    // Получаем архетипы для маппинга кода -> ID
    const archetypes = await this.app.prisma.archetype.findMany();
    const archetypeMap = new Map(archetypes.map((a) => [a.code, a.id]));

    // Получаем ID архетипа по коду
    const targetArchetypeId = archetypeMap.get(data.archetypeCode);
    if (!targetArchetypeId) {
      throw new ValidationError(`Unknown archetype code: ${data.archetypeCode}`);
    }

    // Создаём ответ с type: 'clarification'
    const answer = await this.app.prisma.answer.create({
      data: {
        situationId: currentSituation.id,
        type: 'clarification',
        text: data.text,
        targetArchetypeId,
        analysisJson: JSON.parse(JSON.stringify(analysis)),
      },
    });

    // Сохраняем скоры по каждому архетипу
    await this.app.prisma.answerScore.createMany({
      data: Object.entries(analysis.scores).map(([code, score]) => ({
        answerId: answer.id,
        archetypeId: archetypeMap.get(code)!,
        score,
        confidence: 1.0,
      })),
    });

    return {
      answerId: answer.id,
      scores: analysis.scores,
    };
  }

  /**
   * Переход к следующей ситуации после всех clarification
   */
  async nextSituation(sessionId: string): Promise<{ isSessionComplete: boolean }> {
    const session = await this.app.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    const nextSituationIndex = session.situationIndex + 1;
    const isSessionComplete = nextSituationIndex >= MAX_SITUATIONS;

    // Обновляем сессию — переходим к следующей ситуации или завершаем
    await this.app.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: isSessionComplete ? 'in_progress' : 'in_progress',
        phase: isSessionComplete ? 'generating_report' : 'situation',
        situationIndex: nextSituationIndex,
        pendingArchetypes: [],
      },
    });

    return { isSessionComplete };
  }

  /**
   * Завершение сессии и генерация отчёта
   */
  async complete(sessionId: string): Promise<void> {
    const session = await this.app.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        player: true,
        situations: {
          include: {
            answers: {
              include: {
                scores: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    if (session.status === 'completed') {
      throw new SessionAlreadyCompletedError(sessionId);
    }

    // Получаем архетипы для маппинга id -> code/name
    const archetypes = await this.app.prisma.archetype.findMany();
    const archetypeMap = new Map(archetypes.map((a) => [a.id, a]));

    // Собираем все скоры по архетипам
    const archetypeScores = new Map<number, number[]>();

    for (const situation of session.situations) {
      for (const answer of situation.answers) {
        for (const score of answer.scores) {
          const scores = archetypeScores.get(score.archetypeId) ?? [];
          scores.push(score.score);
          archetypeScores.set(score.archetypeId, scores);
        }
      }
    }

    // Рассчитываем средние скоры и определяем strength
    const sessionResults: Array<{
      sessionId: string;
      archetypeId: number;
      finalScore: number;
      strength: 'dominant' | 'moderate' | 'weak' | 'absent';
    }> = [];

    for (const [archetypeId, scores] of archetypeScores) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const finalScore = Math.round(avgScore * 10) / 10; // округляем до 1 знака

      // Определяем strength по уровню скора
      let strength: 'dominant' | 'moderate' | 'weak' | 'absent';
      if (finalScore >= 8) {
        strength = 'dominant';
      } else if (finalScore >= 5) {
        strength = 'moderate';
      } else if (finalScore >= 2) {
        strength = 'weak';
      } else {
        strength = 'absent';
      }

      sessionResults.push({
        sessionId,
        archetypeId,
        finalScore,
        strength,
      });
    }

    // Записываем результаты в БД
    if (sessionResults.length > 0) {
      await this.app.prisma.sessionResult.createMany({
        data: sessionResults,
      });
    }

    // Подготавливаем данные для генерации отчётов
    const scoresForReport = sessionResults.map((r) => {
      const archetype = archetypeMap.get(r.archetypeId);
      return {
        archetypeCode: (archetype?.code ?? 'unknown') as ArchetypeCode,
        archetypeName: archetype?.name ?? 'Unknown',
        finalScore: r.finalScore,
        strength: r.strength,
      };
    });

    const reportContext = {
      playerName: session.player.name ?? undefined,
      playerPosition: session.player.position ?? undefined,
      scores: scoresForReport,
    };

    // Генерируем отчёты через LLM
    const [playerSummary, coachReport] = await Promise.all([
      this.llmService.generatePlayerReport(reportContext),
      this.llmService.generateCoachReport(reportContext),
    ]);

    // Создаём запись отчёта в БД
    await this.app.prisma.report.create({
      data: {
        sessionId,
        playerSummary,
        coachReport: coachReport as unknown as object,
      },
    });

    await this.app.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        phase: null,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Прерывание сессии
   */
  async abandon(sessionId: string): Promise<void> {
    const session = await this.app.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    if (session.status === 'completed' || session.status === 'abandoned') {
      return; // Уже завершена
    }

    await this.app.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'abandoned',
        phase: null,
      },
    });
  }

  private toDto(session: Session): SessionDto {
    return {
      id: session.id,
      playerId: session.playerId,
      language: session.language as Language,
      status: session.status,
      phase: session.phase,
      situationIndex: session.situationIndex,
      startedAt: session.startedAt?.toISOString() ?? null,
      completedAt: session.completedAt?.toISOString() ?? null,
      createdAt: session.createdAt.toISOString(),
    };
  }

  private toWithDetailsDto(
    session: Session & {
      player: { id: number; telegramId: bigint; name: string | null; position: string | null; jerseyNumber: number | null; createdAt: Date };
      _count: { situations: number };
      situations: Array<{ _count: { answers: number } }>;
    }
  ): SessionWithDetailsDto {
    const answersCount = session.situations.reduce((acc, s) => acc + s._count.answers, 0);

    return {
      ...this.toDto(session),
      player: {
        id: session.player.id,
        telegramId: session.player.telegramId.toString(),
        name: session.player.name,
        position: session.player.position as 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | null,
        jerseyNumber: session.player.jerseyNumber,
        createdAt: session.player.createdAt.toISOString(),
      },
      situationsCount: session._count.situations,
      answersCount,
    };
  }

  private situationToDto(situation: Situation): SituationDto {
    return {
      id: situation.id,
      sessionId: situation.sessionId,
      orderNum: situation.orderNum,
      content: situation.content,
      contextType: situation.contextType,
      createdAt: situation.createdAt.toISOString(),
    };
  }
}

export function createSessionService(app: FastifyInstance): SessionService {
  return new SessionService(app);
}
