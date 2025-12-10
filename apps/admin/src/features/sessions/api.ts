import { apiRequest } from '@/shared/api/client';
import type { PaginatedResponse, SessionWithDetailsDto } from '@archetypes/shared';

export interface GetSessionsParams {
  page?: number;
  pageSize?: number;
  playerId?: number;
  status?: string;
}

export async function getSessions(params: GetSessionsParams = {}): Promise<PaginatedResponse<SessionWithDetailsDto>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.playerId) query.set('playerId', String(params.playerId));
  if (params.status) query.set('status', params.status);

  return apiRequest('GET', `/sessions?${query.toString()}`);
}

export async function getSession(id: string): Promise<SessionWithDetailsDto> {
  return apiRequest('GET', `/sessions/${id}`);
}
