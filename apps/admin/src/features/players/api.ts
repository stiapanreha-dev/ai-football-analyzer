import { apiRequest } from '@/shared/api/client';
import type { PaginatedResponse, PlayerWithStatsDto } from '@archetypes/shared';

export interface GetPlayersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  position?: string;
}

export async function getPlayers(params: GetPlayersParams = {}): Promise<PaginatedResponse<PlayerWithStatsDto>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.search) query.set('search', params.search);
  if (params.position) query.set('position', params.position);

  return apiRequest('GET', `/players?${query.toString()}`);
}

export async function getPlayer(id: number): Promise<PlayerWithStatsDto> {
  return apiRequest('GET', `/players/${id}`);
}

export async function deletePlayer(id: number): Promise<void> {
  return apiRequest('DELETE', `/players/${id}`);
}
