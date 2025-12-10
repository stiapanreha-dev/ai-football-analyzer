import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@archetypes/database';

export interface AuditLogEntry {
  source: 'bot' | 'backend' | 'admin';
  action: string;
  telegramId?: bigint | number;
  playerId?: number;
  sessionId?: string;
  data?: Record<string, unknown>;
  success?: boolean;
  errorMsg?: string;
}

export interface AuditLogDto {
  id: number;
  timestamp: string;
  source: string;
  action: string;
  telegramId: string | null;
  playerId: number | null;
  sessionId: string | null;
  data: Record<string, unknown> | null;
  success: boolean;
  errorMsg: string | null;
  playerName?: string | null;
}

export interface GetAuditLogsQuery {
  page?: number;
  pageSize?: number;
  source?: string;
  action?: string;
  telegramId?: string;
  playerId?: number;
  sessionId?: string;
  from?: string;
  to?: string;
}

export class AuditService {
  constructor(private readonly app: FastifyInstance) {}

  /**
   * Записать событие в аудит-лог
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.app.prisma.auditLog.create({
        data: {
          source: entry.source,
          action: entry.action,
          telegramId: entry.telegramId ? BigInt(entry.telegramId) : null,
          playerId: entry.playerId ?? null,
          sessionId: entry.sessionId ?? null,
          data: entry.data as object | undefined,
          success: entry.success ?? true,
          errorMsg: entry.errorMsg ?? null,
        },
      });
    } catch (error) {
      // Не падаем если не удалось записать лог
      this.app.log.error({ error, entry }, 'Failed to write audit log');
    }
  }

  /**
   * Получить список записей аудит-лога
   */
  async findAll(query: GetAuditLogsQuery): Promise<{
    items: AuditLogDto[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const skip = (page - 1) * pageSize;

    const where: Prisma.AuditLogWhereInput = {};

    if (query.source) where.source = query.source;
    if (query.action) where.action = { contains: query.action };
    if (query.telegramId) where.telegramId = BigInt(query.telegramId);
    if (query.playerId) where.playerId = query.playerId;
    if (query.sessionId) where.sessionId = query.sessionId;
    if (query.from || query.to) {
      where.timestamp = {};
      if (query.from) where.timestamp.gte = new Date(query.from);
      if (query.to) where.timestamp.lte = new Date(query.to);
    }

    const [logs, total] = await Promise.all([
      this.app.prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { timestamp: 'desc' },
        include: {
          player: {
            select: { name: true },
          },
        },
      }),
      this.app.prisma.auditLog.count({ where }),
    ]);

    return {
      items: logs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        source: log.source,
        action: log.action,
        telegramId: log.telegramId?.toString() ?? null,
        playerId: log.playerId,
        sessionId: log.sessionId,
        data: log.data as Record<string, unknown> | null,
        success: log.success,
        errorMsg: log.errorMsg,
        playerName: log.player?.name,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Получить статистику по действиям
   */
  async getStats(from?: Date, to?: Date): Promise<{
    totalEvents: number;
    bySource: Record<string, number>;
    byAction: Record<string, number>;
    errorRate: number;
  }> {
    const where: Prisma.AuditLogWhereInput = {};
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = from;
      if (to) where.timestamp.lte = to;
    }

    const [total, errors, sourceGroups, actionGroups] = await Promise.all([
      this.app.prisma.auditLog.count({ where }),
      this.app.prisma.auditLog.count({ where: { ...where, success: false } }),
      this.app.prisma.auditLog.groupBy({
        by: ['source'],
        where,
        _count: true,
      }),
      this.app.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 20,
      }),
    ]);

    const bySource: Record<string, number> = {};
    for (const group of sourceGroups) {
      bySource[group.source] = group._count;
    }

    const byAction: Record<string, number> = {};
    for (const group of actionGroups) {
      byAction[group.action] = group._count;
    }

    return {
      totalEvents: total,
      bySource,
      byAction,
      errorRate: total > 0 ? errors / total : 0,
    };
  }
}

export function createAuditService(app: FastifyInstance): AuditService {
  return new AuditService(app);
}
