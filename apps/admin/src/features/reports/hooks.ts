import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getReports, getReport, generateMissingReports, type GetReportsParams } from './api';

export function useReports(params: GetReportsParams = {}) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => getReports(params),
  });
}

export function useReport(id: number) {
  return useQuery({
    queryKey: ['reports', id],
    queryFn: () => getReport(id),
    enabled: id > 0,
  });
}

export function useGenerateMissingReports() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateMissingReports,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
