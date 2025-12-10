import { apiRequest } from '@/shared/api/client';
import type { PaginatedResponse, ReportWithPlayerDto } from '@archetypes/shared';

export interface GetReportsParams {
  page?: number;
  pageSize?: number;
  playerId?: number;
}

export async function getReports(params: GetReportsParams = {}): Promise<PaginatedResponse<ReportWithPlayerDto>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.playerId) query.set('playerId', String(params.playerId));

  return apiRequest('GET', `/reports?${query.toString()}`);
}

export async function getReport(id: number): Promise<ReportWithPlayerDto> {
  return apiRequest('GET', `/reports/${id}`);
}

export interface GenerateMissingReportsResult {
  generated: number;
  sessionIds: string[];
}

export async function generateMissingReports(): Promise<GenerateMissingReportsResult> {
  return apiRequest('POST', '/reports/generate-missing');
}

export async function generateReportForSession(sessionId: string): Promise<ReportWithPlayerDto> {
  return apiRequest('POST', `/reports/session/${sessionId}/generate`);
}
