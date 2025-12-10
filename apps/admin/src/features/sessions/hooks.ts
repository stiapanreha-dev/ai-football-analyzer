import { useQuery } from '@tanstack/react-query';

import { getSessions, getSession, type GetSessionsParams } from './api';

export function useSessions(params: GetSessionsParams = {}) {
  return useQuery({
    queryKey: ['sessions', params],
    queryFn: () => getSessions(params),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: () => getSession(id),
    enabled: !!id,
  });
}
