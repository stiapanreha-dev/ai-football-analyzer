import { pino } from 'pino';

import { config, isDevelopment } from '../config.js';

export const logger = pino({
  level: config.logLevel,
  transport: isDevelopment()
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export type Logger = typeof logger;
