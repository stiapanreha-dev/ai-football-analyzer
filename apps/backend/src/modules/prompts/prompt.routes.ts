import type { FastifyPluginAsync } from 'fastify';
import type { ApiResponse, PromptDto, PromptKey, TestPromptResultDto } from '@archetypes/shared';

import { getPromptParamsSchema, updatePromptBodySchema } from './prompt.schemas.js';
import { createPromptService } from './prompt.service.js';

const promptsRoutes: FastifyPluginAsync = async (fastify) => {
  const promptService = createPromptService(fastify);

  // GET /prompts - Список всех промптов (только для админов)
  fastify.get<{
    Reply: ApiResponse<PromptDto[]>;
  }>(
    '/',
    {
      schema: {
        tags: ['prompts'],
        summary: 'Список всех промптов',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.requireAdmin],
    },
    async (_request, reply) => {
      const prompts = await promptService.findAll();

      return reply.send({
        success: true,
        data: prompts,
      });
    }
  );

  // GET /prompts/:key - Получение конкретного промпта (только для админов)
  fastify.get<{
    Params: { key: string };
    Reply: ApiResponse<PromptDto>;
  }>(
    '/:key',
    {
      schema: {
        tags: ['prompts'],
        summary: 'Получение промпта по ключу',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.requireAdmin],
    },
    async (request, reply) => {
      const { key } = getPromptParamsSchema.parse(request.params);
      const prompt = await promptService.findByKey(key);

      return reply.send({
        success: true,
        data: prompt,
      });
    }
  );

  // PUT /prompts/:key - Обновление промпта (только для админов)
  fastify.put<{
    Params: { key: string };
    Body: { value: string };
    Reply: ApiResponse<PromptDto>;
  }>(
    '/:key',
    {
      schema: {
        tags: ['prompts'],
        summary: 'Обновление промпта',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.requireAdmin],
    },
    async (request, reply) => {
      const { key } = getPromptParamsSchema.parse(request.params);
      const { value } = updatePromptBodySchema.parse(request.body);
      const prompt = await promptService.update(key, value);

      return reply.send({
        success: true,
        data: prompt,
      });
    }
  );

  // POST /prompts/:key/test - Тестирование промпта (только для админов)
  fastify.post<{
    Params: { key: string };
    Body: { template: string };
    Reply: ApiResponse<TestPromptResultDto>;
  }>(
    '/:key/test',
    {
      schema: {
        tags: ['prompts'],
        summary: 'Тестирование промпта с генерацией примера',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.requireAdmin],
    },
    async (request, reply) => {
      const { key } = getPromptParamsSchema.parse(request.params);
      const body = request.body as { template: string };
      const result = await promptService.test(key as PromptKey, body.template);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );
};

export default promptsRoutes;
