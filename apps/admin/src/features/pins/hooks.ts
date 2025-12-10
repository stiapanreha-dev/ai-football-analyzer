import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreatePinInput } from '@archetypes/shared';

import { getPins, createPin, revokePin, type GetPinsParams } from './api';

export function usePins(params: GetPinsParams = {}) {
  return useQuery({
    queryKey: ['pins', params],
    queryFn: () => getPins(params),
  });
}

export function useCreatePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePinInput) => createPin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pins'] });
    },
  });
}

export function useRevokePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => revokePin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pins'] });
    },
  });
}
