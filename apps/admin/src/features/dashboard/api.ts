import { apiRequest } from '@/shared/api/client';
import type { DashboardStatsDto, RecentActivityDto } from '@archetypes/shared';

export async function getDashboardStats(): Promise<DashboardStatsDto> {
  return apiRequest('GET', '/dashboard/stats');
}

export async function getRecentActivity(limit = 10): Promise<RecentActivityDto[]> {
  return apiRequest('GET', `/dashboard/recent?limit=${limit}`);
}
