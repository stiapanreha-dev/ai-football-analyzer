import type { FastifyPluginAsync } from 'fastify';

import type {
  ApiResponse,
  TestWaveDto,
  TestWaveDetailDto,
} from '@archetypes/shared';

import {
  teamIdParamsSchema,
  waveIdParamsSchema,
  createWaveBodySchema,
} from './wave.schemas.js';
import { createWaveService } from './wave.service.js';

const waveRoutes: FastifyPluginAsync = async (fastify) => {
  const waveService = createWaveService(fastify);

  // GET /teams/:id/waves - Список волн команды
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<TestWaveDto[]>;
  }>(
    '/:id/waves',
    {
      schema: {
        tags: ['waves'],
        summary: 'Список волн тестирования команды',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = teamIdParamsSchema.parse(request.params);
      const waves = await waveService.findByTeam(id);

      return reply.send({
        success: true,
        data: waves,
      });
    }
  );

  // GET /teams/:id/waves/:waveId - Детали волны
  fastify.get<{
    Params: { id: string; waveId: string };
    Reply: ApiResponse<TestWaveDetailDto>;
  }>(
    '/:id/waves/:waveId',
    {
      schema: {
        tags: ['waves'],
        summary: 'Детали волны тестирования',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { waveId } = waveIdParamsSchema.parse(request.params);
      const wave = await waveService.findById(waveId);

      return reply.send({
        success: true,
        data: wave,
      });
    }
  );

  // POST /teams/:id/waves - Создать волну
  fastify.post<{
    Params: { id: string };
    Reply: ApiResponse<TestWaveDetailDto>;
  }>(
    '/:id/waves',
    {
      schema: {
        tags: ['waves'],
        summary: 'Создать волну тестирования',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = teamIdParamsSchema.parse(request.params);
      const body = createWaveBodySchema.parse(request.body);
      const wave = await waveService.create(id, body);

      return reply.status(201).send({
        success: true,
        data: wave,
      });
    }
  );

  // POST /teams/:id/waves/:waveId/start - Запустить волну
  fastify.post<{
    Params: { id: string; waveId: string };
    Reply: ApiResponse<TestWaveDetailDto>;
  }>(
    '/:id/waves/:waveId/start',
    {
      schema: {
        tags: ['waves'],
        summary: 'Запустить волну (отправить push уведомления)',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { waveId } = waveIdParamsSchema.parse(request.params);
      const wave = await waveService.start(waveId);

      return reply.send({
        success: true,
        data: wave,
      });
    }
  );

  // POST /teams/:id/waves/:waveId/complete - Завершить волну
  fastify.post<{
    Params: { id: string; waveId: string };
    Reply: ApiResponse<TestWaveDetailDto>;
  }>(
    '/:id/waves/:waveId/complete',
    {
      schema: {
        tags: ['waves'],
        summary: 'Завершить волну',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { waveId } = waveIdParamsSchema.parse(request.params);
      const wave = await waveService.complete(waveId);

      return reply.send({
        success: true,
        data: wave,
      });
    }
  );

  // DELETE /teams/:id/waves/:waveId - Отменить волну
  fastify.delete<{
    Params: { id: string; waveId: string };
    Reply: ApiResponse<{ message: string }>;
  }>(
    '/:id/waves/:waveId',
    {
      schema: {
        tags: ['waves'],
        summary: 'Отменить волну',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { waveId } = waveIdParamsSchema.parse(request.params);
      await waveService.cancel(waveId);

      return reply.send({
        success: true,
        data: { message: 'Волна отменена' },
      });
    }
  );
};

export default waveRoutes;
