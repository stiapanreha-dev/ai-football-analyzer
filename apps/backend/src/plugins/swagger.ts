import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

import { isDevelopment } from '../config.js';

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Football Archetypes API',
        description: 'API для системы психологического профилирования футболистов',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:8000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'auth', description: 'Аутентификация' },
        { name: 'pins', description: 'Управление PIN-кодами' },
        { name: 'players', description: 'Управление игроками' },
        { name: 'sessions', description: 'Сессии тестирования' },
        { name: 'reports', description: 'Отчёты' },
        { name: 'dashboard', description: 'Статистика' },
        { name: 'stt', description: 'Speech-to-Text' },
      ],
    },
  });

  if (isDevelopment()) {
    await fastify.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
    });
    fastify.log.info('Swagger UI available at /docs');
  }

  fastify.log.info('Swagger plugin registered');
};

export default fp(swaggerPlugin, {
  name: 'swagger',
});
