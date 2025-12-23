import { createBot, redis } from './bot.js';
import { logger } from './middleware/logging.js';

// Таймаут на graceful shutdown
const SHUTDOWN_TIMEOUT = 10_000; // 10 сек

async function main(): Promise<void> {
  const bot = await createBot();

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  let isShuttingDown = false;

  for (const signal of signals) {
    process.on(signal, async () => {
      if (isShuttingDown) {
        logger.warn('Force exit due to repeated shutdown signal');
        process.exit(1);
      }
      isShuttingDown = true;

      logger.info(`Received ${signal}, stopping bot...`);

      // Force exit если shutdown занимает слишком долго
      const forceExitTimer = setTimeout(() => {
        logger.error('Shutdown timeout, forcing exit');
        process.exit(1);
      }, SHUTDOWN_TIMEOUT);

      try {
        // Останавливаем бота
        await bot.stop();
        logger.info('Bot stopped');

        // Закрываем Redis соединение
        await redis.quit();
        logger.info('Redis disconnected');

        clearTimeout(forceExitTimer);
        process.exit(0);
      } catch (error) {
        logger.error({ error }, 'Error during shutdown');
        clearTimeout(forceExitTimer);
        process.exit(1);
      }
    });
  }

  // Запуск бота
  logger.info('Starting bot...');
  await bot.start({
    onStart: (botInfo) => {
      logger.info({ username: botInfo.username }, 'Bot started');
    },
  });
}

main().catch((error) => {
  logger.error({ error }, 'Failed to start bot');
  process.exit(1);
});
