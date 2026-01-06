import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getAdmins, createAdmin, deleteAdmin } from './api';
import type { GetAdminsParams, CreateAdminDto } from './api';

export function useAdmins(params?: GetAdminsParams) {
  return useQuery({
    queryKey: ['admins', params],
    queryFn: () => getAdmins(params),
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdminDto) => createAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
}
