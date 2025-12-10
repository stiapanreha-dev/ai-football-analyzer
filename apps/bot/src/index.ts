import { createBot } from './bot.js';
import { logger } from './middleware/logging.js';

async function main(): Promise<void> {
  const bot = await createBot();

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, stopping bot...`);
      await bot.stop();
      process.exit(0);
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
