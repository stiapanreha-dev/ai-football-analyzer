import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTeamDto, UpdateTeamDto } from '@archetypes/shared';

import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addPlayersToTeam,
  removePlayersFromTeam,
  generateTeamReport,
  getTeamReports,
  getTeamReport,
  type GetTeamsParams,
} from './api';

export function useTeams(params: GetTeamsParams = {}) {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: () => getTeams(params),
  });
}

export function useTeam(id: number) {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: () => getTeam(id),
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamDto) => createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTeamDto }) => updateTeam(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams', id] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useAddPlayersToTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, playerIds }: { teamId: number; playerIds: number[] }) =>
      addPlayersToTeam(teamId, playerIds),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
    },
  });
}

export function useRemovePlayersFromTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, playerIds }: { teamId: number; playerIds: number[] }) =>
      removePlayersFromTeam(teamId, playerIds),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
    },
  });
}

export function useGenerateTeamReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: number) => generateTeamReport(teamId),
    onSuccess: (_, teamId) => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'reports'] });
    },
  });
}

export function useTeamReports(teamId: number) {
  return useQuery({
    queryKey: ['teams', teamId, 'reports'],
    queryFn: () => getTeamReports(teamId),
    enabled: !!teamId,
  });
}

export function useTeamReport(teamId: number, reportId: number) {
  return useQuery({
    queryKey: ['teams', teamId, 'reports', reportId],
    queryFn: () => getTeamReport(teamId, reportId),
    enabled: !!teamId && !!reportId,
  });
}
