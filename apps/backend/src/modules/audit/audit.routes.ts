import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { createAuditService } from './audit.service.js';

const createAuditLogSchema = z.object({
  source: z.enum(['bot', 'backend', 'admin']),
  action: z.string().min(1).max(100),
  telegramId: z.union([z.string(), z.number()]).optional(),
  playerId: z.number().int().optional(),
  sessionId: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  success: z.boolean().optional(),
  errorMsg: z.string().optional(),
});

const getAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  source: z.string().optional(),
  action: z.string().optional(),
  telegramId: z.string().optional(),
  playerId: z.coerce.number().int().optional(),
  sessionId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const getStatsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const auditRoutes: FastifyPluginAsync = async (app) => {
  const auditService = createAuditService(app);

  // Сохраняем сервис в app для использования в других модулях
  app.decorate('audit', auditService);

  // POST /audit - записать событие (для бота)
  app.post(
    '/',
    {
      schema: {
        tags: ['Audit'],
        summary: 'Log an audit event',
      },
    },
    async (request, reply) => {
      const body = createAuditLogSchema.parse(request.body);

      await auditService.log({
        source: body.source,
        action: body.action,
        telegramId: body.telegramId ? BigInt(body.telegramId) : undefined,
        playerId: body.playerId,
        sessionId: body.sessionId,
        data: body.data,
        success: body.success,
        errorMsg: body.errorMsg,
      });

      return reply.status(201).send({ success: true });
    }
  );

  // GET /audit - получить список событий
  app.get(
    '/',
    {
      schema: {
        tags: ['Audit'],
        summary: 'Get audit logs',
      },
    },
    async (request) => {
      const query = getAuditLogsQuerySchema.parse(request.query);
      return auditService.findAll(query);
    }
  );

  // GET /audit/stats - получить статистику
  app.get(
    '/stats',
    {
      schema: {
        tags: ['Audit'],
        summary: 'Get audit statistics',
      },
    },
    async (request) => {
      const query = getStatsQuerySchema.parse(request.query);

      return auditService.getStats(
        query.from ? new Date(query.from) : undefined,
        query.to ? new Date(query.to) : undefined
      );
    }
  );
};

// Расширяем типы Fastify
declare module 'fastify' {
  interface FastifyInstance {
    audit: ReturnType<typeof createAuditService>;
  }
}
