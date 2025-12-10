import {
  createPlayerSchema,
  updatePlayerSchema,
  getPlayerParamsSchema,
  getPlayersQuerySchema,
  getPlayerByTelegramIdParamsSchema,
} from '@archetypes/shared';

export {
  createPlayerSchema,
  updatePlayerSchema,
  getPlayerParamsSchema,
  getPlayersQuerySchema,
  getPlayerByTelegramIdParamsSchema,
};

export type CreatePlayerInput = typeof createPlayerSchema._type;
export type UpdatePlayerInput = typeof updatePlayerSchema._type;
export type GetPlayerParams = typeof getPlayerParamsSchema._type;
export type GetPlayersQuery = typeof getPlayersQuerySchema._type;
export type GetPlayerByTelegramIdParams = typeof getPlayerByTelegramIdParamsSchema._type;
