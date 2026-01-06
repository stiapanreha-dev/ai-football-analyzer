import { apiRequest } from '@/shared/api/client';

export interface AdminDto {
  id: number;
  telegramId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface CreateAdminDto {
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetAdminsParams {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}

export async function getAdmins(params?: GetAdminsParams): Promise<PaginatedResponse<AdminDto>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());

  const query = searchParams.toString();
  return apiRequest<PaginatedResponse<AdminDto>>('GET', `/admins${query ? `?${query}` : ''}`);
}

export async function getAdmin(id: number): Promise<AdminDto> {
  return apiRequest<AdminDto>('GET', `/admins/${id}`);
}

export async function createAdmin(data: CreateAdminDto): Promise<AdminDto> {
  return apiRequest<AdminDto>('POST', '/admins', data);
}

export async function deleteAdmin(id: number): Promise<void> {
  return apiRequest('DELETE', `/admins/${id}`);
}
