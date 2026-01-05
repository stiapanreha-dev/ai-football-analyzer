import type { FastifyInstance } from 'fastify';

import type {
  PlayerDynamicsDto,
  TeamDynamicsDto,
  ArchetypeChangeDto,
  ArchetypeCode,
} from '@archetypes/shared';
import { ARCHETYPES } from '@archetypes/shared';

import { NotFoundError } from '../../utils/errors.js';

export function createDynamicsService(fastify: FastifyInstance) {
  const { prisma } = fastify;

  /**
   * Получить динамику изменений для игрока (сравнение 2 последних сессий)
   */
  async function getPlayerDynamics(playerId: number): Promise<PlayerDynamicsDto> {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new NotFoundError('Игрок не найден');
    }

    // Получить 2 последние завершённые сессии
    const sessions = await prisma.session.findMany({
      where: {
        playerId,
        status: 'completed',
      },
      orderBy: { completedAt: 'desc' },
      take: 2,
      include: {
        results: {
          include: { archetype: true },
        },
      },
    });

    if (sessions.length === 0) {
      throw new NotFoundError('У игрока нет завершённых сессий');
    }

    const currentSession = sessions[0]!;
    const previousSession = sessions[1] ?? null;

    const changes = calculateArchetypeChanges(
      previousSession?.results ?? null,
      currentSession.results
    );

    return {
      playerId,
      playerName: player.name,
      currentSession: {
        id: currentSession.id,
        date: currentSession.completedAt?.toISOString() ?? currentSession.createdAt.toISOString(),
      },
      previousSession: previousSession
        ? {
            id: previousSession.id,
            date: previousSession.completedAt?.toISOString() ?? previousSession.createdAt.toISOString(),
          }
        : null,
      changes,
    };
  }

  /**
   * Получить динамику изменений для команды (сравнение 2 последних волн)
   */
  async function getTeamDynamics(teamId: number): Promise<TeamDynamicsDto> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { players: true },
    });

    if (!team) {
      throw new NotFoundError('Команда не найдена');
    }

    // Получить 2 последние завершённые волны
    const waves = await prisma.testWave.findMany({
      where: {
        teamId,
        status: 'completed',
      },
      orderBy: { completedAt: 'desc' },
      take: 2,
      include: {
        participations: {
          include: {
            player: true,
            session: {
              include: {
                results: {
                  include: { archetype: true },
                },
              },
            },
          },
        },
      },
    });

    if (waves.length === 0) {
      throw new NotFoundError('Нет завершённых волн тестирования');
    }

    const currentWave = waves[0]!;
    const previousWave = waves[1] ?? null;

    // Агрегировать результаты по архетипам для каждой волны
    const currentProfile = aggregateWaveProfile(currentWave.participations);
    const previousProfile = previousWave ? aggregateWaveProfile(previousWave.participations) : null;

    const profileChanges = calculateProfileChanges(previousProfile, currentProfile);

    // Посчитать изменения по каждому игроку
    const playerChanges: PlayerDynamicsDto[] = [];
    for (const participation of currentWave.participations) {
      if (!participation.session?.results.length) continue;

      // Найти предыдущую сессию этого игрока в предыдущей волне
      const prevParticipation = previousWave?.participations.find(
        (p) => p.playerId === participation.playerId
      );

      const changes = calculateArchetypeChanges(
        prevParticipation?.session?.results ?? null,
        participation.session.results
      );

      playerChanges.push({
        playerId: participation.playerId,
        playerName: participation.player.name,
        currentSession: {
          id: participation.session.id,
          date: participation.session.completedAt?.toISOString() ?? participation.session.createdAt.toISOString(),
        },
        previousSession: prevParticipation?.session
          ? {
              id: prevParticipation.session.id,
              date: prevParticipation.session.completedAt?.toISOString() ?? prevParticipation.session.createdAt.toISOString(),
            }
          : null,
        changes,
      });
    }

    return {
      teamId,
      teamName: team.name,
      currentWave: {
        id: currentWave.id,
        date: currentWave.completedAt?.toISOString() ?? currentWave.createdAt.toISOString(),
      },
      previousWave: previousWave
        ? {
            id: previousWave.id,
            date: previousWave.completedAt?.toISOString() ?? previousWave.createdAt.toISOString(),
          }
        : null,
      profileChanges,
      playerChanges,
    };
  }

  return {
    getPlayerDynamics,
    getTeamDynamics,
  };
}

type SessionResultWithArchetype = {
  finalScore: number;
  archetype: { code: string; name: string };
};

function calculateArchetypeChanges(
  previousResults: SessionResultWithArchetype[] | null,
  currentResults: SessionResultWithArchetype[]
): ArchetypeChangeDto[] {
  const changes: ArchetypeChangeDto[] = [];

  for (const current of currentResults) {
    const code = current.archetype.code as ArchetypeCode;
    const previous = previousResults?.find((r) => r.archetype.code === code);

    const previousScore = previous?.finalScore ?? null;
    const currentScore = current.finalScore;
    const delta = previousScore !== null ? currentScore - previousScore : null;

    let trend: 'up' | 'down' | 'stable' | 'new';
    if (previousScore === null) {
      trend = 'new';
    } else if (delta !== null && delta > 0.5) {
      trend = 'up';
    } else if (delta !== null && delta < -0.5) {
      trend = 'down';
    } else {
      trend = 'stable';
    }

    changes.push({
      archetypeCode: code,
      archetypeName: ARCHETYPES[code]?.name ?? current.archetype.name,
      previousScore,
      currentScore,
      delta,
      trend,
    });
  }

  return changes;
}

type ParticipationWithSession = {
  session: {
    results: SessionResultWithArchetype[];
  } | null;
};

function aggregateWaveProfile(
  participations: ParticipationWithSession[]
): Map<ArchetypeCode, number> {
  const scores = new Map<ArchetypeCode, number[]>();

  for (const p of participations) {
    if (!p.session?.results) continue;
    for (const r of p.session.results) {
      const code = r.archetype.code as ArchetypeCode;
      if (!scores.has(code)) {
        scores.set(code, []);
      }
      scores.get(code)!.push(r.finalScore);
    }
  }

  const profile = new Map<ArchetypeCode, number>();
  for (const [code, values] of scores) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    profile.set(code, avg);
  }

  return profile;
}

function calculateProfileChanges(
  previousProfile: Map<ArchetypeCode, number> | null,
  currentProfile: Map<ArchetypeCode, number>
): ArchetypeChangeDto[] {
  const changes: ArchetypeChangeDto[] = [];

  for (const [code, currentScore] of currentProfile) {
    const previousScore = previousProfile?.get(code) ?? null;
    const delta = previousScore !== null ? currentScore - previousScore : null;

    let trend: 'up' | 'down' | 'stable' | 'new';
    if (previousScore === null) {
      trend = 'new';
    } else if (delta !== null && delta > 0.5) {
      trend = 'up';
    } else if (delta !== null && delta < -0.5) {
      trend = 'down';
    } else {
      trend = 'stable';
    }

    changes.push({
      archetypeCode: code,
      archetypeName: ARCHETYPES[code]?.name ?? code,
      previousScore,
      currentScore,
      delta,
      trend,
    });
  }

  return changes;
}

export type DynamicsService = ReturnType<typeof createDynamicsService>;
