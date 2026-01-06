import { apiRequest } from '@/shared/api/client';

export type AdminRole = 'admin' | 'user';

export interface AdminDto {
  id: number;
  telegramId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramLoginResponse {
  token: string;
  admin: AdminDto;
}

export interface LoginResponse {
  token: string;
}

export interface MeResponse {
  role: string;
  admin?: AdminDto;
}

export async function loginTelegram(data: TelegramAuthData): Promise<TelegramLoginResponse> {
  return apiRequest<TelegramLoginResponse>('POST', '/auth/telegram', data);
}

export async function login(password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('POST', '/auth/login', { password });
}

export async function logout(): Promise<void> {
  return apiRequest('POST', '/auth/logout');
}

export async function getMe(): Promise<MeResponse> {
  return apiRequest('GET', '/auth/me');
}
