import Fastify from 'fastify';
import cors from '@fastify/cors';

import { config } from './config.js';
import { logger } from './utils/logger.js';

// Plugins
import prismaPlugin from './plugins/prisma.js';
import redisPlugin from './plugins/redis.js';
import authPlugin from './plugins/auth.js';
import swaggerPlugin from './plugins/swagger.js';
import errorHandlerPlugin from './plugins/error-handler.js';

// Routes
import authRoutes from './modules/auth/auth.routes.js';
import pinsRoutes from './modules/pins/pin.routes.js';
import playersRoutes from './modules/players/player.routes.js';
import sessionsRoutes from './modules/sessions/session.routes.js';
import reportsRoutes from './modules/reports/report.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import promptsRoutes from './modules/prompts/prompt.routes.js';
import sttRoutes from './services/stt/stt.routes.js';
import teamsRoutes from './modules/teams/team.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: logger.level,
      transport: config.nodeEnv === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
    disableRequestLogging: config.nodeEnv === 'production',
  });

  // CORS
  await app.register(cors, {
    origin: config.nodeEnv === 'development' ? true : false,
    credentials: true,
  });

  // Plugins
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(authPlugin);
  await app.register(swaggerPlugin);
  await app.register(errorHandlerPlugin);

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API routes
  await app.register(
    async (api) => {
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(pinsRoutes, { prefix: '/pins' });
      await api.register(playersRoutes, { prefix: '/players' });
      await api.register(sessionsRoutes, { prefix: '/sessions' });
      await api.register(reportsRoutes, { prefix: '/reports' });
      await api.register(teamsRoutes, { prefix: '/teams' });
      await api.register(dashboardRoutes, { prefix: '/dashboard' });
      await api.register(auditRoutes, { prefix: '/audit' });
      await api.register(promptsRoutes, { prefix: '/prompts' });
      await api.register(sttRoutes, { prefix: '/stt' });
    },
    { prefix: '/api/v1' }
  );

  return app;
}
