import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  // Bot
  botToken: z.string().min(1),

  // Backend API
  apiUrl: z.string().url(),

  // Redis (for sessions)
  redisUrl: z.string().url(),

  // Environment
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const result = configSchema.safeParse({
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    apiUrl: process.env.BACKEND_API_URL ?? 'http://localhost:8000',
    redisUrl: process.env.REDIS_URL,
    nodeEnv: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL,
  });

  if (!result.success) {
    console.error('Invalid configuration:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();

export function isDevelopment(): boolean {
  return config.nodeEnv === 'development';
}

export function isProduction(): boolean {
  return config.nodeEnv === 'production';
}
