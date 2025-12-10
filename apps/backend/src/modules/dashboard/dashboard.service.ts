import type { FastifyInstance } from 'fastify';

import type { DashboardStatsDto, RecentActivityDto } from '@archetypes/shared';

export class DashboardService {
  constructor(private readonly app: FastifyInstance) {}

  /**
   * Получение статистики для дашборда
   */
  async getStats(): Promise<DashboardStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPlayers,
      totalSessions,
      completedSessions,
      todaySessions,
      activePins,
    ] = await Promise.all([
      this.app.prisma.player.count(),
      this.app.prisma.session.count(),
      this.app.prisma.session.count({ where: { status: 'completed' } }),
      this.app.prisma.session.count({
        where: {
          createdAt: { gte: today },
        },
      }),
      this.app.prisma.accessPin.count({
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      }),
    ]);

    const completionRate = totalSessions > 0 ? completedSessions / totalSessions : 0;

    return {
      totalPlayers,
      totalSessions,
      completedSessions,
      completionRate,
      todaySessions,
      activePins,
    };
  }

  /**
   * Получение последних событий
   */
  async getRecentActivity(limit = 10): Promise<RecentActivityDto[]> {
    const activities: RecentActivityDto[] = [];

    // Последние завершённые сессии
    const recentCompletedSessions = await this.app.prisma.session.findMany({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: limit,
      include: { player: true },
    });

    for (const session of recentCompletedSessions) {
      activities.push({
        type: 'session_completed',
        description: `Сессия завершена для ${session.player.name ?? `Игрок #${session.playerId}`}`,
        timestamp: session.completedAt?.toISOString() ?? session.createdAt.toISOString(),
        entityId: session.id,
      });
    }

    // Последние начатые сессии
    const recentStartedSessions = await this.app.prisma.session.findMany({
      where: { status: 'in_progress' },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: { player: true },
    });

    for (const session of recentStartedSessions) {
      activities.push({
        type: 'session_started',
        description: `Сессия начата для ${session.player.name ?? `Игрок #${session.playerId}`}`,
        timestamp: session.startedAt?.toISOString() ?? session.createdAt.toISOString(),
        entityId: session.id,
      });
    }

    // Последние зарегистрированные игроки
    const recentPlayers = await this.app.prisma.player.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    for (const player of recentPlayers) {
      activities.push({
        type: 'player_registered',
        description: `Новый игрок: ${player.name ?? `#${player.id}`}`,
        timestamp: player.createdAt.toISOString(),
        entityId: player.id,
      });
    }

    // Последние созданные PIN-коды
    const recentPins = await this.app.prisma.accessPin.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    for (const pin of recentPins) {
      activities.push({
        type: 'pin_created',
        description: `Создан PIN-код ${pin.code} (${pin.type})`,
        timestamp: pin.createdAt.toISOString(),
        entityId: pin.id,
      });
    }

    // Сортируем по времени и берём последние N
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, limit);
  }
}

export function createDashboardService(app: FastifyInstance): DashboardService {
  return new DashboardService(app);
}
