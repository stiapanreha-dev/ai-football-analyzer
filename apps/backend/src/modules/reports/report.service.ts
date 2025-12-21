import type { FastifyInstance } from 'fastify';
import type { Report } from '@archetypes/database';

import type {
  ReportDto,
  ReportWithPlayerDto,
  SessionResultDto,
  ArchetypeScoreDto,
  CoachReportDto,
  PaginatedResponse,
} from '@archetypes/shared';

import { NotFoundError } from '../../utils/errors.js';
import { createLlmService, type LlmService } from '../../services/llm/llm.service.js';

import type { GetReportsQuery } from './report.schemas.js';

export class ReportService {
  private readonly llmService: LlmService;

  constructor(private readonly app: FastifyInstance) {
    this.llmService = createLlmService(this.app);
  }

  /**
   * Получение списка отчётов
   */
  async findAll(query: GetReportsQuery): Promise<PaginatedResponse<ReportWithPlayerDto>> {
    const { page, pageSize, playerId } = query;
    const skip = (page - 1) * pageSize;

    const where: { session?: { playerId: number } } = {};
    if (playerId) {
      where.session = { playerId };
    }

    const [reports, total] = await Promise.all([
      this.app.prisma.report.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          session: {
            include: {
              player: true,
              results: {
                include: {
                  archetype: true,
                },
              },
            },
          },
        },
      }),
      this.app.prisma.report.count({ where }),
    ]);

    const items = reports.map((r) => this.toWithPlayerDto(r));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Получение отчёта по ID
   */
  async findById(id: number): Promise<ReportWithPlayerDto> {
    const report = await this.app.prisma.report.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            player: true,
            results: {
              include: {
                archetype: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundError('Report', id);
    }

    return this.toWithPlayerDto(report);
  }

  /**
   * Получение отчёта по ID сессии
   */
  async findBySessionId(sessionId: string): Promise<ReportWithPlayerDto | null> {
    const report = await this.app.prisma.report.findUnique({
      where: { sessionId },
      include: {
        session: {
          include: {
            player: true,
            results: {
              include: {
                archetype: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return null;
    }

    return this.toWithPlayerDto(report);
  }

  /**
   * Ретроактивная генерация отчётов для сессий без отчётов
   */
  async generateMissingReports(): Promise<{ generated: number; sessionIds: string[] }> {
    // Находим все завершённые сессии без отчётов
    const sessionsWithoutReports = await this.app.prisma.session.findMany({
      where: {
        status: 'completed',
        report: null,
      },
      include: {
        player: true,
        results: {
          include: {
            archetype: true,
          },
        },
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

    // Получаем архетипы для маппинга
    const archetypes = await this.app.prisma.archetype.findMany();
    const archetypeMap = new Map(archetypes.map((a) => [a.id, a]));

    const generatedIds: string[] = [];

    for (const session of sessionsWithoutReports) {
      let scoresForReport: ArchetypeScoreDto[];

      // Если есть session.results - используем их
      if (session.results.length > 0) {
        scoresForReport = session.results.map((r) => ({
          archetypeCode: r.archetype.code as ArchetypeScoreDto['archetypeCode'],
          archetypeName: r.archetype.name,
          finalScore: r.finalScore,
          strength: r.strength as ArchetypeScoreDto['strength'],
        }));
      } else {
        // Иначе вычисляем из answer_scores
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

        if (archetypeScores.size === 0) {
          continue; // Нет данных для генерации
        }

        // Рассчитываем средние скоры и создаём SessionResult записи
        const sessionResults: Array<{
          sessionId: string;
          archetypeId: number;
          finalScore: number;
          strength: 'dominant' | 'moderate' | 'weak' | 'absent';
        }> = [];

        for (const [archetypeId, scores] of archetypeScores) {
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          const finalScore = Math.round(avgScore * 10) / 10;

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
            sessionId: session.id,
            archetypeId,
            finalScore,
            strength,
          });
        }

        // Сохраняем SessionResult записи
        await this.app.prisma.sessionResult.createMany({
          data: sessionResults,
        });

        // Преобразуем для отчёта
        scoresForReport = sessionResults.map((r) => {
          const archetype = archetypeMap.get(r.archetypeId);
          return {
            archetypeCode: (archetype?.code ?? 'unknown') as ArchetypeScoreDto['archetypeCode'],
            archetypeName: archetype?.name ?? 'Unknown',
            finalScore: r.finalScore,
            strength: r.strength,
          };
        });
      }

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
          sessionId: session.id,
          playerSummary,
          coachReport: coachReport as unknown as object,
        },
      });

      generatedIds.push(session.id);
    }

    return {
      generated: generatedIds.length,
      sessionIds: generatedIds,
    };
  }

  /**
   * Генерация отчёта для конкретной сессии
   */
  async generateReportForSession(sessionId: string): Promise<ReportWithPlayerDto> {
    const session = await this.app.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        player: true,
        results: {
          include: {
            archetype: true,
          },
        },
        report: true,
      },
    });

    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    if (session.status !== 'completed') {
      throw new Error(`Session ${sessionId} is not completed (status: ${session.status})`);
    }

    if (session.report) {
      throw new Error(`Report already exists for session ${sessionId}`);
    }

    if (session.results.length === 0) {
      throw new Error(`Session ${sessionId} has no results`);
    }

    const scoresForReport: ArchetypeScoreDto[] = session.results.map((r) => ({
      archetypeCode: r.archetype.code as ArchetypeScoreDto['archetypeCode'],
      archetypeName: r.archetype.name,
      finalScore: r.finalScore,
      strength: r.strength as ArchetypeScoreDto['strength'],
    }));

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
    const report = await this.app.prisma.report.create({
      data: {
        sessionId,
        playerSummary,
        coachReport: coachReport as unknown as object,
      },
      include: {
        session: {
          include: {
            player: true,
            results: {
              include: {
                archetype: true,
              },
            },
          },
        },
      },
    });

    return this.toWithPlayerDto(report);
  }

  /**
   * Получение результата сессии (скоры по архетипам)
   */
  async getSessionResult(sessionId: string): Promise<SessionResultDto | null> {
    const session = await this.app.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        player: true,
        results: {
          include: {
            archetype: true,
          },
        },
        report: true,
      },
    });

    if (!session || session.status !== 'completed') {
      return null;
    }

    const scores: ArchetypeScoreDto[] = session.results.map((r) => ({
      archetypeCode: r.archetype.code as ArchetypeScoreDto['archetypeCode'],
      archetypeName: r.archetype.name,
      finalScore: r.finalScore,
      strength: r.strength,
    }));

    return {
      sessionId: session.id,
      playerId: session.playerId,
      playerName: session.player.name,
      completedAt: session.completedAt?.toISOString() ?? '',
      scores,
      playerSummary: session.report?.playerSummary ?? '',
    };
  }

  private toDto(report: Report): ReportDto {
    return {
      id: report.id,
      sessionId: report.sessionId,
      playerSummary: report.playerSummary,
      coachReport: report.coachReport as unknown as CoachReportDto,
      createdAt: report.createdAt.toISOString(),
    };
  }

  private toWithPlayerDto(
    report: Report & {
      session: {
        player: {
          id: number;
          telegramId: bigint;
          name: string | null;
          position: string | null;
          jerseyNumber: number | null;
          createdAt: Date;
        };
        results: Array<{
          archetype: {
            code: string;
            name: string;
          };
          finalScore: number;
          strength: string;
        }>;
      };
    }
  ): ReportWithPlayerDto {
    const scores: ArchetypeScoreDto[] = report.session.results.map((r) => ({
      archetypeCode: r.archetype.code as ArchetypeScoreDto['archetypeCode'],
      archetypeName: r.archetype.name,
      finalScore: r.finalScore,
      strength: r.strength as ArchetypeScoreDto['strength'],
    }));

    return {
      ...this.toDto(report),
      player: {
        id: report.session.player.id,
        telegramId: report.session.player.telegramId.toString(),
        name: report.session.player.name,
        position: report.session.player.position as 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | null,
        jerseyNumber: report.session.player.jerseyNumber,
        createdAt: report.session.player.createdAt.toISOString(),
      },
      scores,
    };
  }
}

export function createReportService(app: FastifyInstance): ReportService {
  return new ReportService(app);
}
