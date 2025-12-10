import type { Bot } from 'grammy';

import type { MyContext } from '../../utils/context.js';
import { setupStartHandlers } from './handlers.js';

export function setupStartFeature(bot: Bot<MyContext>): void {
  setupStartHandlers(bot);
}

export * from './keyboards.js';
