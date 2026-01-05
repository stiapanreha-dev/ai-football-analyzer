import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getPlayers, getPlayer, deletePlayer, updatePlayer, type GetPlayersParams, type UpdatePlayerParams } from './api';

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

export function useDeletePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlayerParams }) => updatePlayer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}
