import { apiRequest } from '@/shared/api/client';

export interface LoginResponse {
  token: string;
}

export async function login(password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('POST', '/auth/login', { password });
}

export async function logout(): Promise<void> {
  return apiRequest('POST', '/auth/logout');
}

export async function getMe(): Promise<{ role: string }> {
  return apiRequest('GET', '/auth/me');
}
