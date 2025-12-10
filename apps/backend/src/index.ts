import { config } from './config.js';
import { buildApp } from './app.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  const app = await buildApp();

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, shutting down...`);
      await app.close();
      process.exit(0);
    });
  }

  try {
    await app.listen({
      port: config.port,
      host: config.host,
    });

    logger.info(`Server running at http://${config.host}:${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main();
