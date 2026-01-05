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
  simulateTeamReport,
  getTeamReports,
  getTeamReport,
  getTeamWaves,
  getTeamWave,
  createTeamWave,
  startTeamWave,
  completeTeamWave,
  cancelTeamWave,
  getTeamDynamics,
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

export function useSimulateTeamReport() {
  return useMutation({
    mutationFn: ({ teamId, playerIds }: { teamId: number; playerIds: number[] }) =>
      simulateTeamReport(teamId, playerIds),
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

// Wave hooks
export function useTeamWaves(teamId: number) {
  return useQuery({
    queryKey: ['teams', teamId, 'waves'],
    queryFn: () => getTeamWaves(teamId),
    enabled: !!teamId,
  });
}

export function useTeamWave(teamId: number, waveId: number) {
  return useQuery({
    queryKey: ['teams', teamId, 'waves', waveId],
    queryFn: () => getTeamWave(teamId, waveId),
    enabled: !!teamId && !!waveId,
  });
}

export function useCreateTeamWave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, name }: { teamId: number; name?: string }) => createTeamWave(teamId, name),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'waves'] });
    },
  });
}

export function useStartTeamWave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, waveId }: { teamId: number; waveId: number }) => startTeamWave(teamId, waveId),
    onSuccess: (_, { teamId, waveId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'waves'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'waves', waveId] });
    },
  });
}

export function useCompleteTeamWave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, waveId }: { teamId: number; waveId: number }) => completeTeamWave(teamId, waveId),
    onSuccess: (_, { teamId, waveId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'waves'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'waves', waveId] });
    },
  });
}

export function useCancelTeamWave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, waveId }: { teamId: number; waveId: number }) => cancelTeamWave(teamId, waveId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'waves'] });
    },
  });
}

// Dynamics hooks
export function useTeamDynamics(teamId: number) {
  return useQuery({
    queryKey: ['teams', teamId, 'dynamics'],
    queryFn: () => getTeamDynamics(teamId),
    enabled: !!teamId,
  });
}
