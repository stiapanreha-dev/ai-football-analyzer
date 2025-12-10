import { apiRequest } from '@/shared/api/client';
import type { PaginatedResponse, PinDto, CreatePinInput } from '@archetypes/shared';

export interface GetPinsParams {
  page?: number;
  pageSize?: number;
  type?: string;
  isActive?: boolean;
}

export async function getPins(params: GetPinsParams = {}): Promise<PaginatedResponse<PinDto>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.type) query.set('type', params.type);
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive));

  return apiRequest('GET', `/pins?${query.toString()}`);
}

export async function createPin(data: CreatePinInput): Promise<PinDto> {
  return apiRequest('POST', '/pins', data);
}

export async function revokePin(id: number): Promise<void> {
  return apiRequest('DELETE', `/pins/${id}`);
}
