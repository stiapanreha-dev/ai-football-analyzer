export interface CoachReportResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  bestSituations: string[];
  riskSituations: string[];
  compatibility: {
    worksWith: string[];
    conflictsWith: string[];
  };
  recommendations: string[];
}

export function parseCoachReportResponse(response: string): CoachReportResult {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse coach report: no JSON found');
  }

  return JSON.parse(jsonMatch[0]) as CoachReportResult;
}
