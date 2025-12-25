import type { FastifyInstance } from 'fastify';

import type {
  TeamDto,
  TeamWithPlayersDto,
  TeamPlayerDto,
  PaginatedResponse,
  CreateTeamDto,
  UpdateTeamDto,
  ArchetypeCode,
} from '@archetypes/shared';

import { NotFoundError } from '@/utils/errors.js';

import type { GetTeamsQuery } from './team.schemas.js';

export function createTeamService(fastify: FastifyInstance) {
  const { prisma } = fastify;

  async function findAll(query: GetTeamsQuery): Promise<PaginatedResponse<TeamDto>> {
    const { page, pageSize, search } = query;
    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { players: true },
          },
        },
      }),
      prisma.team.count({ where }),
    ]);

    return {
      items: teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        playersCount: team._count.players,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async function findById(id: number): Promise<TeamWithPlayersDto> {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            player: {
              include: {
                sessions: {
                  where: { status: 'completed' },
                  include: {
                    report: true,
                    results: {
                      include: { archetype: true },
                      orderBy: { finalScore: 'desc' },
                      take: 1,
                    },
                  },
                  orderBy: { completedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundError('Команда не найдена');
    }

    const players: TeamPlayerDto[] = team.players.map((tp) => {
      const lastSession = tp.player.sessions[0];
      const hasReport = !!lastSession?.report;
      const dominantArchetype = lastSession?.results[0]?.archetype?.code as ArchetypeCode | undefined;

      return {
        id: tp.player.id,
        name: tp.player.name,
        position: tp.player.position,
        jerseyNumber: tp.player.jerseyNumber,
        hasReport,
        dominantArchetype,
      };
    });

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      playersCount: team.players.length,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
      players,
    };
  }

  async function create(data: CreateTeamDto): Promise<TeamDto> {
    const team = await prisma.team.create({
      data: {
        name: data.name,
        description: data.description,
        players: data.playerIds
          ? {
              create: data.playerIds.map((playerId) => ({ playerId })),
            }
          : undefined,
      },
      include: {
        _count: { select: { players: true } },
      },
    });

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      playersCount: team._count.players,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    };
  }

  async function update(id: number, data: UpdateTeamDto): Promise<TeamDto> {
    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Команда не найдена');
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        _count: { select: { players: true } },
      },
    });

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      playersCount: team._count.players,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    };
  }

  async function remove(id: number): Promise<void> {
    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Команда не найдена');
    }

    await prisma.team.delete({ where: { id } });
  }

  async function addPlayers(teamId: number, playerIds: number[]): Promise<TeamWithPlayersDto> {
    const existing = await prisma.team.findUnique({ where: { id: teamId } });
    if (!existing) {
      throw new NotFoundError('Команда не найдена');
    }

    // Add players that don't already exist in the team
    await prisma.teamPlayer.createMany({
      data: playerIds.map((playerId) => ({ teamId, playerId })),
      skipDuplicates: true,
    });

    return findById(teamId);
  }

  async function removePlayers(teamId: number, playerIds: number[]): Promise<TeamWithPlayersDto> {
    const existing = await prisma.team.findUnique({ where: { id: teamId } });
    if (!existing) {
      throw new NotFoundError('Команда не найдена');
    }

    await prisma.teamPlayer.deleteMany({
      where: {
        teamId,
        playerId: { in: playerIds },
      },
    });

    return findById(teamId);
  }

  return {
    findAll,
    findById,
    create,
    update,
    remove,
    addPlayers,
    removePlayers,
  };
}

export type TeamService = ReturnType<typeof createTeamService>;
