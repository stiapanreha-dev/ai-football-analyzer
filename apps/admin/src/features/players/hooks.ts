import { useQuery } from '@tanstack/react-query';

import { getPlayers, getPlayer, type GetPlayersParams } from './api';

export function usePlayers(params: GetPlayersParams = {}) {
  return useQuery({
    queryKey: ['players', params],
    queryFn: () => getPlayers(params),
  });
}

export function usePlayer(id: number) {
  return useQuery({
    queryKey: ['players', id],
    queryFn: () => getPlayer(id),
    enabled: !!id,
  });
}
