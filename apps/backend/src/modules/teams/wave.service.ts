import type { FastifyInstance } from 'fastify';

import type {
  TestWaveDto,
  TestWaveDetailDto,
  WaveParticipationDto,
  CreateTestWaveDto,
  WaveNotificationPayload,
  Language,
} from '@archetypes/shared';

import { NotFoundError, ValidationError } from '../../utils/errors.js';

const REDIS_CHANNEL = 'bot:notifications';

export function createWaveService(fastify: FastifyInstance) {
  const { prisma, redis } = fastify;

  /**
   * Получить список волн команды
   */
  async function findByTeam(teamId: number): Promise<TestWaveDto[]> {
    const waves = await prisma.testWave.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      include: {
        participations: {
          include: {
            session: true,
          },
        },
      },
    });

    return waves.map((wave) => ({
      id: wave.id,
      teamId: wave.teamId,
      name: wave.name,
      status: wave.status,
      createdAt: wave.createdAt.toISOString(),
      startedAt: wave.startedAt?.toISOString() ?? null,
      completedAt: wave.completedAt?.toISOString() ?? null,
      participantsCount: wave.participations.length,
      completedCount: wave.participations.filter(
        (p) => p.session?.status === 'completed'
      ).length,
      teamReportId: wave.teamReportId,
    }));
  }

  /**
   * Получить волну с детальной информацией об участниках
   */
  async function findById(waveId: number): Promise<TestWaveDetailDto> {
    const wave = await prisma.testWave.findUnique({
      where: { id: waveId },
      include: {
        participations: {
          include: {
            player: true,
            session: true,
          },
        },
      },
    });

    if (!wave) {
      throw new NotFoundError('Волна не найдена');
    }

    const participations: WaveParticipationDto[] = wave.participations.map((p) => ({
      playerId: p.playerId,
      playerName: p.player.name,
      notified: p.notified,
      notifiedAt: p.notifiedAt?.toISOString() ?? null,
      completed: p.session?.status === 'completed',
      completedAt: p.session?.completedAt?.toISOString() ?? null,
      sessionId: p.sessionId,
    }));

    return {
      id: wave.id,
      teamId: wave.teamId,
      name: wave.name,
      status: wave.status,
      createdAt: wave.createdAt.toISOString(),
      startedAt: wave.startedAt?.toISOString() ?? null,
      completedAt: wave.completedAt?.toISOString() ?? null,
      participantsCount: wave.participations.length,
      completedCount: participations.filter((p) => p.completed).length,
      teamReportId: wave.teamReportId,
      participations,
    };
  }

  /**
   * Создать волну тестирования (в статусе draft)
   */
  async function create(teamId: number, data: CreateTestWaveDto): Promise<TestWaveDetailDto> {
    // Проверить, что команда существует и получить игроков
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          include: { player: true },
        },
      },
    });

    if (!team) {
      throw new NotFoundError('Команда не найдена');
    }

    if (team.players.length === 0) {
      throw new ValidationError('В команде нет игроков');
    }

    // Создать волну с participation для каждого игрока
    const wave = await prisma.testWave.create({
      data: {
        teamId,
        name: data.name,
        status: 'draft',
        participations: {
          create: team.players.map((tp) => ({
            playerId: tp.playerId,
          })),
        },
      },
      include: {
        participations: {
          include: {
            player: true,
            session: true,
          },
        },
      },
    });

    const participations: WaveParticipationDto[] = wave.participations.map((p) => ({
      playerId: p.playerId,
      playerName: p.player.name,
      notified: p.notified,
      notifiedAt: p.notifiedAt?.toISOString() ?? null,
      completed: false,
      completedAt: null,
      sessionId: null,
    }));

    return {
      id: wave.id,
      teamId: wave.teamId,
      name: wave.name,
      status: wave.status,
      createdAt: wave.createdAt.toISOString(),
      startedAt: null,
      completedAt: null,
      participantsCount: participations.length,
      completedCount: 0,
      teamReportId: null,
      participations,
    };
  }

  /**
   * Запустить волну - отправить push уведомления всем участникам
   */
  async function start(waveId: number): Promise<TestWaveDetailDto> {
    const wave = await prisma.testWave.findUnique({
      where: { id: waveId },
      include: {
        team: true,
        participations: {
          include: {
            player: {
              include: {
                sessions: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  select: { language: true },
                },
              },
            },
          },
        },
      },
    });

    if (!wave) {
      throw new NotFoundError('Волна не найдена');
    }

    if (wave.status !== 'draft') {
      throw new ValidationError('Волна уже запущена или завершена');
    }

    // Подготовить payload для Redis
    const payload: WaveNotificationPayload = {
      type: 'wave_start',
      waveId: wave.id,
      teamId: wave.teamId,
      teamName: wave.team.name,
      participants: wave.participations.map((p) => ({
        playerId: p.playerId,
        telegramId: p.player.telegramId.toString(),
        language: (p.player.sessions[0]?.language ?? 'ru') as Language,
      })),
    };

    // Опубликовать в Redis
    await redis.publish(REDIS_CHANNEL, JSON.stringify(payload));

    // Обновить статус волны и отметить участников как уведомлённых
    const now = new Date();
    await prisma.$transaction([
      prisma.testWave.update({
        where: { id: waveId },
        data: {
          status: 'active',
          startedAt: now,
        },
      }),
      prisma.testWaveParticipation.updateMany({
        where: { waveId },
        data: {
          notified: true,
          notifiedAt: now,
        },
      }),
    ]);

    return findById(waveId);
  }

  /**
   * Завершить волну
   */
  async function complete(waveId: number): Promise<TestWaveDetailDto> {
    const wave = await prisma.testWave.findUnique({
      where: { id: waveId },
    });

    if (!wave) {
      throw new NotFoundError('Волна не найдена');
    }

    if (wave.status !== 'active') {
      throw new ValidationError('Волна не активна');
    }

    await prisma.testWave.update({
      where: { id: waveId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    return findById(waveId);
  }

  /**
   * Отменить волну
   */
  async function cancel(waveId: number): Promise<void> {
    const wave = await prisma.testWave.findUnique({
      where: { id: waveId },
    });

    if (!wave) {
      throw new NotFoundError('Волна не найдена');
    }

    if (wave.status === 'completed') {
      throw new ValidationError('Нельзя отменить завершённую волну');
    }

    await prisma.testWave.update({
      where: { id: waveId },
      data: { status: 'cancelled' },
    });
  }

  /**
   * Привязать сессию к участию в волне
   */
  async function linkSession(waveId: number, playerId: number, sessionId: string): Promise<void> {
    await prisma.testWaveParticipation.update({
      where: {
        waveId_playerId: { waveId, playerId },
      },
      data: { sessionId },
    });
  }

  /**
   * Привязать отчёт команды к волне
   */
  async function linkReport(waveId: number, teamReportId: number): Promise<void> {
    await prisma.testWave.update({
      where: { id: waveId },
      data: { teamReportId },
    });
  }

  return {
    findByTeam,
    findById,
    create,
    start,
    complete,
    cancel,
    linkSession,
    linkReport,
  };
}

export type WaveService = ReturnType<typeof createWaveService>;
