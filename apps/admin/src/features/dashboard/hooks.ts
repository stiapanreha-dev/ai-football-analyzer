import { useQuery } from '@tanstack/react-query';

import { getDashboardStats, getRecentActivity } from './api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'recent', limit],
    queryFn: () => getRecentActivity(limit),
    refetchInterval: 30000,
  });
}
