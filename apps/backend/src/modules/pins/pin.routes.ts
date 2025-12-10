import type { FastifyPluginAsync } from 'fastify';

import type { ApiResponse, PaginatedResponse, PinDto, ValidatePinResultDto, PinUsageDto } from '@archetypes/shared';

import {
  createPinSchema,
  validatePinSchema,
  getPinParamsSchema,
  getPinsQuerySchema,
} from './pin.schemas.js';
import { createPinService } from './pin.service.js';

const pinsRoutes: FastifyPluginAsync = async (fastify) => {
  const pinService = createPinService(fastify);

  // POST /pins - Создание PIN-кода (защищённый)
  fastify.post<{
    Reply: ApiResponse<PinDto>;
  }>(
    '/',
    {
      schema: {
        tags: ['pins'],
        summary: 'Создать PIN-код',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const data = createPinSchema.parse(request.body);
      const pin = await pinService.create(data);

      return reply.status(201).send({
        success: true,
        data: pin,
      });
    }
  );

  // GET /pins - Список PIN-кодов (защищённый)
  fastify.get<{
    Reply: ApiResponse<PaginatedResponse<PinDto>>;
  }>(
    '/',
    {
      schema: {
        tags: ['pins'],
        summary: 'Список PIN-кодов',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const query = getPinsQuerySchema.parse(request.query);
      const result = await pinService.findAll(query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // GET /pins/:id - Детали PIN-кода (защищённый)
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<PinDto>;
  }>(
    '/:id',
    {
      schema: {
        tags: ['pins'],
        summary: 'Детали PIN-кода',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = getPinParamsSchema.parse(request.params);
      const pin = await pinService.findById(id);

      return reply.send({
        success: true,
        data: pin,
      });
    }
  );

  // DELETE /pins/:id - Отзыв PIN-кода (защищённый)
  fastify.delete<{
    Params: { id: string };
  }>(
    '/:id',
    {
      schema: {
        tags: ['pins'],
        summary: 'Отозвать PIN-код',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = getPinParamsSchema.parse(request.params);
      await pinService.revoke(id);

      return reply.status(204).send();
    }
  );

  // GET /pins/:id/usages - История использования (защищённый)
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<PinUsageDto[]>;
  }>(
    '/:id/usages',
    {
      schema: {
        tags: ['pins'],
        summary: 'История использования PIN-кода',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = getPinParamsSchema.parse(request.params);
      const usages = await pinService.getUsages(id);

      return reply.send({
        success: true,
        data: usages,
      });
    }
  );

  // POST /pins/validate - Валидация PIN-кода (открытый, для бота)
  fastify.post<{
    Reply: ApiResponse<ValidatePinResultDto>;
  }>(
    '/validate',
    {
      schema: {
        tags: ['pins'],
        summary: 'Валидация PIN-кода (для бота)',
      },
    },
    async (request, reply) => {
      const { code, telegramId } = validatePinSchema.parse(request.body);
      const result = await pinService.validate(code, telegramId);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );
};

export default pinsRoutes;
