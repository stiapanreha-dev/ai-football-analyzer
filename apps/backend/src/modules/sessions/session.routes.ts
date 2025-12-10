import type { FastifyPluginAsync } from 'fastify';

import type {
  ApiResponse,
  PaginatedResponse,
  SessionDto,
  SessionWithDetailsDto,
  SituationDto,
  SubmitAnswerResultDto,
} from '@archetypes/shared';

import {
  startSessionSchema,
  getSessionParamsSchema,
  getSessionsQuerySchema,
  submitAnswerSchema,
  submitClarificationSchema,
} from './session.schemas.js';
import { createSessionService } from './session.service.js';

const sessionsRoutes: FastifyPluginAsync = async (fastify) => {
  const sessionService = createSessionService(fastify);

  // POST /sessions - Создание сессии (для бота)
  fastify.post<{
    Reply: ApiResponse<SessionDto>;
  }>(
    '/',
    {
      schema: {
        tags: ['sessions'],
        summary: 'Создать сессию (для бота)',
      },
    },
    async (request, reply) => {
      const data = startSessionSchema.parse(request.body);
      const session = await sessionService.create(data);

      return reply.status(201).send({
        success: true,
        data: session,
      });
    }
  );

  // GET /sessions - Список сессий (защищённый)
  fastify.get<{
    Reply: ApiResponse<PaginatedResponse<SessionWithDetailsDto>>;
  }>(
    '/',
    {
      schema: {
        tags: ['sessions'],
        summary: 'Список сессий',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const query = getSessionsQuerySchema.parse(request.query);
      const result = await sessionService.findAll(query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // GET /sessions/player/:playerId/active - Активная сессия игрока (для бота)
  fastify.get<{
    Params: { playerId: string };
    Reply: ApiResponse<SessionDto | null>;
  }>(
    '/player/:playerId/active',
    {
      schema: {
        tags: ['sessions'],
        summary: 'Получить активную сессию игрока (для бота)',
      },
    },
    async (request, reply) => {
      const playerId = parseInt(request.params.playerId, 10);
      const session = await sessionService.getActiveSession(playerId);

      return reply.send({
        success: true,
        data: session,
      });
    }
  );

  // GET /sessions/:id - Детали сессии (защищённый)
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<SessionWithDetailsDto>;
  }>(
    '/:id',
    {
      schema: {
        tags: ['sessions'],
        summary: 'Детали сессии',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = getSessionParamsSchema.parse(request.params);
      const session = await sessionService.findById(id);

      return reply.send({
        success: true,
        data: session,
      });
    }
  );

  // GET /sessions/:id/situation - Текущая ситуация (для бота)
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<SituationDto | null>;
  }>(
    '/:id/situation',
    {
      schema: {
        tags: ['sessions'],
        summary: 'Получить текущую ситуацию (для бота)',
      },
    },
    async (request, reply) => {
      const { id } = getSessionParamsSchema.parse(request.params);
      const situation = await sessionService.getCurrentSituation(id);

      return reply.send({
        success: true,
        data: situation,
      });
    }
  );

  // POST /sessions/:id/answer - Отправка ответа (для бота)
  fastify.post<{
    Params: { id: string };
    Reply: ApiResponse<SubmitAnswerResultDto>;
  }>(
    '/:id/answer',
    {
      schema: {
        tags: ['sessions'],
        summary: 'Отправить ответ на ситуацию (для бота)',
      },
    },
    async (request, reply) => {
      const { id } = getSessionParamsSchema.parse(request.params);
      const { text } = submitAnswerSchema.parse(request.body);
      const result = await sessionService.submitAnswer(id, text);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // POST /sessions/:id/clarification - Уточняющий ответ (для бота)
  fastify.post<{
    Params: { id: string };
    Reply: ApiResponse<SubmitAnswerResultDto>;
  }>(
    '/:id/clarification',
    {
      schema: {
        tags: ['sessions'],
        summary: 'Отправить уточняющий ответ (для бота)',
      },
    },
    async (request, reply) => {
      const { id } = getSessionParamsSchema.parse(request.params);
      const data = submitClarificationSchema.parse(request.body);
      const result = await sessionService.submitClarification(id, data);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // POST /sessions/:id/complete - Завершение сессии (для бота)
  fastify.post<{
    Params: { id: string };
  }>(
    '/:id/complete',
    {
      schema: {
        tags: ['sessions'],
        summary: 'Завершить сессию (для бота)',
      },
    },
    async (request, reply) => {
      const { id } = getSessionParamsSchema.parse(request.params);
      await sessionService.complete(id);

      return reply.send({
        success: true,
        data: { message: 'Session completed' },
      });
    }
  );

  // POST /sessions/:id/abandon - Прерывание сессии (для бота)
  fastify.post<{
    Params: { id: string };
  }>(
    '/:id/abandon',
    {
      schema: {
        tags: ['sessions'],
        summary: 'Прервать сессию (для бота)',
      },
    },
    async (request, reply) => {
      const { id } = getSessionParamsSchema.parse(request.params);
      await sessionService.abandon(id);

      return reply.send({
        success: true,
        data: { message: 'Session abandoned' },
      });
    }
  );
};

export default sessionsRoutes;
