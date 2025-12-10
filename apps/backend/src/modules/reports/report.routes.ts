import type { FastifyPluginAsync } from 'fastify';

import type { ApiResponse, PaginatedResponse, ReportWithPlayerDto, SessionResultDto } from '@archetypes/shared';

import {
  getReportParamsSchema,
  getReportBySessionParamsSchema,
  getReportsQuerySchema,
} from './report.schemas.js';
import { createReportService } from './report.service.js';

const reportsRoutes: FastifyPluginAsync = async (fastify) => {
  const reportService = createReportService(fastify);

  // GET /reports - Список отчётов (защищённый)
  fastify.get<{
    Reply: ApiResponse<PaginatedResponse<ReportWithPlayerDto>>;
  }>(
    '/',
    {
      schema: {
        tags: ['reports'],
        summary: 'Список отчётов',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const query = getReportsQuerySchema.parse(request.query);
      const result = await reportService.findAll(query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // GET /reports/:id - Детали отчёта (защищённый)
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<ReportWithPlayerDto>;
  }>(
    '/:id',
    {
      schema: {
        tags: ['reports'],
        summary: 'Детали отчёта',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = getReportParamsSchema.parse(request.params);
      const report = await reportService.findById(id);

      return reply.send({
        success: true,
        data: report,
      });
    }
  );

  // GET /reports/session/:sessionId - Отчёт по сессии (для бота и админки)
  fastify.get<{
    Params: { sessionId: string };
    Reply: ApiResponse<ReportWithPlayerDto | null>;
  }>(
    '/session/:sessionId',
    {
      schema: {
        tags: ['reports'],
        summary: 'Отчёт по ID сессии',
      },
    },
    async (request, reply) => {
      const { sessionId } = getReportBySessionParamsSchema.parse(request.params);
      const report = await reportService.findBySessionId(sessionId);

      return reply.send({
        success: true,
        data: report,
      });
    }
  );

  // GET /reports/session/:sessionId/result - Результаты сессии (для бота)
  fastify.get<{
    Params: { sessionId: string };
    Reply: ApiResponse<SessionResultDto | null>;
  }>(
    '/session/:sessionId/result',
    {
      schema: {
        tags: ['reports'],
        summary: 'Результаты сессии (скоры архетипов)',
      },
    },
    async (request, reply) => {
      const { sessionId } = getReportBySessionParamsSchema.parse(request.params);
      const result = await reportService.getSessionResult(sessionId);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // POST /reports/generate-missing - Генерация отчётов для всех сессий без отчётов (защищённый)
  fastify.post<{
    Reply: ApiResponse<{ generated: number; sessionIds: string[] }>;
  }>(
    '/generate-missing',
    {
      schema: {
        tags: ['reports'],
        summary: 'Генерация отчётов для всех завершённых сессий без отчётов',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (_request, reply) => {
      const result = await reportService.generateMissingReports();

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // POST /reports/session/:sessionId/generate - Генерация отчёта для конкретной сессии (защищённый)
  fastify.post<{
    Params: { sessionId: string };
    Reply: ApiResponse<ReportWithPlayerDto>;
  }>(
    '/session/:sessionId/generate',
    {
      schema: {
        tags: ['reports'],
        summary: 'Генерация отчёта для конкретной сессии',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { sessionId } = getReportBySessionParamsSchema.parse(request.params);
      const report = await reportService.generateReportForSession(sessionId);

      return reply.send({
        success: true,
        data: report,
      });
    }
  );

  // TODO: GET /reports/:id/pdf - Генерация PDF (Фаза 7)
};

export default reportsRoutes;
