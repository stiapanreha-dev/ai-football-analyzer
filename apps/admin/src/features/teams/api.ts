import { apiRequest } from '@/shared/api/client';
import type {
  PaginatedResponse,
  TeamDto,
  TeamWithPlayersDto,
  TeamReportDto,
  CreateTeamDto,
  UpdateTeamDto,
  TestWaveDto,
  TestWaveDetailDto,
  TeamDynamicsDto,
} from '@archetypes/shared';

export interface GetTeamsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export async function getTeams(params: GetTeamsParams = {}): Promise<PaginatedResponse<TeamDto>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.search) query.set('search', params.search);

  return apiRequest('GET', `/teams?${query.toString()}`);
}

export async function getTeam(id: number): Promise<TeamWithPlayersDto> {
  return apiRequest('GET', `/teams/${id}`);
}

export async function createTeam(data: CreateTeamDto): Promise<TeamDto> {
  return apiRequest('POST', '/teams', data);
}

export async function updateTeam(id: number, data: UpdateTeamDto): Promise<TeamDto> {
  return apiRequest('PUT', `/teams/${id}`, data);
}

export async function deleteTeam(id: number): Promise<void> {
  return apiRequest('DELETE', `/teams/${id}`);
}

export async function addPlayersToTeam(teamId: number, playerIds: number[]): Promise<TeamWithPlayersDto> {
  return apiRequest('POST', `/teams/${teamId}/players`, { playerIds });
}

export async function removePlayersFromTeam(teamId: number, playerIds: number[]): Promise<TeamWithPlayersDto> {
  return apiRequest('DELETE', `/teams/${teamId}/players`, { playerIds });
}

export async function generateTeamReport(teamId: number): Promise<TeamReportDto> {
  return apiRequest('POST', `/teams/${teamId}/report`);
}

export async function getTeamReports(teamId: number): Promise<TeamReportDto[]> {
  return apiRequest('GET', `/teams/${teamId}/reports`);
}

export async function getTeamReport(teamId: number, reportId: number): Promise<TeamReportDto> {
  return apiRequest('GET', `/teams/${teamId}/reports/${reportId}`);
}

// Wave API
export async function getTeamWaves(teamId: number): Promise<TestWaveDto[]> {
  return apiRequest('GET', `/teams/${teamId}/waves`);
}

export async function getTeamWave(teamId: number, waveId: number): Promise<TestWaveDetailDto> {
  return apiRequest('GET', `/teams/${teamId}/waves/${waveId}`);
}

export async function createTeamWave(teamId: number, name?: string): Promise<TestWaveDetailDto> {
  return apiRequest('POST', `/teams/${teamId}/waves`, { name });
}

export async function startTeamWave(teamId: number, waveId: number): Promise<TestWaveDetailDto> {
  return apiRequest('POST', `/teams/${teamId}/waves/${waveId}/start`);
}

export async function completeTeamWave(teamId: number, waveId: number): Promise<TestWaveDetailDto> {
  return apiRequest('POST', `/teams/${teamId}/waves/${waveId}/complete`);
}

export async function cancelTeamWave(teamId: number, waveId: number): Promise<void> {
  return apiRequest('DELETE', `/teams/${teamId}/waves/${waveId}`);
}

// Dynamics API
export async function getTeamDynamics(teamId: number): Promise<TeamDynamicsDto> {
  return apiRequest('GET', `/teams/${teamId}/dynamics`);
}
