import type { Bot } from 'grammy';

import type { MyContext } from '../../utils/context.js';
import { setupWaveHandlers } from './handlers.js';

export function setupWaveFeature(bot: Bot<MyContext>): void {
  setupWaveHandlers(bot);
}
