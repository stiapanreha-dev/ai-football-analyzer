import { apiRequest } from '@/shared/api/client';
import type { PromptDto, PromptKey, TestPromptResultDto } from '@archetypes/shared';

export async function getPrompts(): Promise<PromptDto[]> {
  return apiRequest('GET', '/prompts');
}

export async function getPrompt(key: PromptKey): Promise<PromptDto> {
  return apiRequest('GET', `/prompts/${key}`);
}

export async function updatePrompt(key: PromptKey, value: string): Promise<PromptDto> {
  return apiRequest('PUT', `/prompts/${key}`, { value });
}

export async function testPrompt(key: PromptKey, template: string): Promise<TestPromptResultDto> {
  return apiRequest('POST', `/prompts/${key}/test`, { template });
}
