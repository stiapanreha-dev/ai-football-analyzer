import type { FastifyInstance } from 'fastify';
import type { Player, PlayerPosition } from '@archetypes/database';

import type { PlayerDto, PlayerWithStatsDto, SessionDto, PaginatedResponse } from '@archetypes/shared';

import { NotFoundError, ConflictError } from '../../utils/errors.js';

import type { CreatePlayerInput, UpdatePlayerInput, GetPlayersQuery } from './player.schemas.js';

export class PlayerService {
  constructor(private readonly app: FastifyInstance) {}

  /**
   * Создание игрока
   */
  async create(data: CreatePlayerInput): Promise<PlayerDto> {
    const telegramId = typeof data.telegramId === 'number' ? BigInt(data.telegramId) : data.telegramId;

    // Проверяем, существует ли игрок с таким telegramId
    const existing = await this.app.prisma.player.findUnique({
      where: { telegramId },
    });

    if (existing) {
      throw new ConflictError('Player with this Telegram ID already exists');
    }

    const player = await this.app.prisma.player.create({
      data: {
        telegramId,
        name: data.name,
        position: data.position,
        jerseyNumber: data.jerseyNumber,
      },
    });

    return this.toDto(player);
  }

  /**
   * Получение списка игроков
   */
  async findAll(query: GetPlayersQuery): Promise<PaginatedResponse<PlayerWithStatsDto>> {
    const { page, pageSize, search, position, sortBy, sortOrder } = query;
    const skip = (page - 1) * pageSize;

    const where: {
      position?: PlayerPosition;
      OR?: Array<{ name?: { contains: string; mode: 'insensitive' } }>;
    } = {};

    if (position) {
      where.position = position;
    }

    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sortBy === 'sessionsCount') {
      // Для сортировки по кол-ву сессий нужен отдельный запрос
      orderBy['createdAt'] = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [players, total] = await Promise.all([
      this.app.prisma.player.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          _count: {
            select: { sessions: true },
          },
          sessions: {
            where: { status: 'completed' },
            select: { completedAt: true },
            orderBy: { completedAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.app.prisma.player.count({ where }),
    ]);

    const items = players.map((p) => this.toWithStatsDto(p));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Получение игрока по ID
   */
  async findById(id: number): Promise<PlayerWithStatsDto> {
    const player = await this.app.prisma.player.findUnique({
      where: { id },
      include: {
        _count: {
          select: { sessions: true },
        },
        sessions: {
          where: { status: 'completed' },
          select: { completedAt: true },
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!player) {
      throw new NotFoundError('Player', id);
    }

    return this.toWithStatsDto(player);
  }

  /**
   * Получение игрока по Telegram ID
   */
  async findByTelegramId(telegramId: bigint): Promise<PlayerWithStatsDto | null> {
    const player = await this.app.prisma.player.findUnique({
      where: { telegramId },
      include: {
        _count: {
          select: { sessions: true },
        },
        sessions: {
          where: { status: 'completed' },
          select: { completedAt: true },
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!player) {
      return null;
    }

    return this.toWithStatsDto(player);
  }

  /**
   * Обновление игрока
   */
  async update(id: number, data: UpdatePlayerInput): Promise<PlayerDto> {
    const player = await this.app.prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      throw new NotFoundError('Player', id);
    }

    const updated = await this.app.prisma.player.update({
      where: { id },
      data: {
        name: data.name,
        position: data.position,
        jerseyNumber: data.jerseyNumber,
      },
    });

    return this.toDto(updated);
  }

  /**
   * Обновление игрока по Telegram ID (для бота)
   */
  async updateByTelegramId(telegramId: bigint, data: UpdatePlayerInput): Promise<PlayerDto> {
    const player = await this.app.prisma.player.findUnique({
      where: { telegramId },
    });

    if (!player) {
      throw new NotFoundError('Player', `telegramId:${telegramId}`);
    }

    const updated = await this.app.prisma.player.update({
      where: { telegramId },
      data: {
        name: data.name,
        position: data.position,
        jerseyNumber: data.jerseyNumber,
        language: data.language,
      },
    });

    return this.toDto(updated);
  }

  /**
   * Удаление игрока по ID
   */
  async delete(id: number): Promise<void> {
    const player = await this.app.prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      throw new NotFoundError('Player', id);
    }

    // Удаляем игрока (каскадно удалятся сессии, отчёты и т.д.)
    await this.app.prisma.player.delete({
      where: { id },
    });
  }

  /**
   * Удаление игрока по Telegram ID (для бота)
   */
  async deleteByTelegramId(telegramId: bigint): Promise<void> {
    const player = await this.app.prisma.player.findUnique({
      where: { telegramId },
    });

    if (!player) {
      throw new NotFoundError('Player', `telegramId:${telegramId}`);
    }

    await this.app.prisma.player.delete({
      where: { telegramId },
    });
  }

  /**
   * Получение сессий игрока
   */
  async getPlayerSessions(playerId: number): Promise<SessionDto[]> {
    const player = await this.app.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new NotFoundError('Player', playerId);
    }

    const sessions = await this.app.prisma.session.findMany({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      playerId: s.playerId,
      language: s.language as 'ru' | 'en' | 'es' | 'fr' | 'pt' | 'el' | 'sr' | 'no',
      status: s.status,
      phase: s.phase,
      situationIndex: s.situationIndex,
      startedAt: s.startedAt?.toISOString() ?? null,
      completedAt: s.completedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  private toDto(player: Player): PlayerDto {
    return {
      id: player.id,
      telegramId: player.telegramId.toString(),
      name: player.name,
      position: player.position,
      jerseyNumber: player.jerseyNumber,
      createdAt: player.createdAt.toISOString(),
    };
  }

  private toWithStatsDto(
    player: Player & {
      _count: { sessions: number };
      sessions: Array<{ completedAt: Date | null }>;
    }
  ): PlayerWithStatsDto {
    const completedSessions = player.sessions.filter((s) => s.completedAt);

    return {
      ...this.toDto(player),
      sessionsCount: player._count.sessions,
      completedSessionsCount: completedSessions.length,
      lastSessionAt: completedSessions[0]?.completedAt?.toISOString() ?? null,
    };
  }
}

export function createPlayerService(app: FastifyInstance): PlayerService {
  return new PlayerService(app);
}
