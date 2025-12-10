import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PromptKey } from '@archetypes/shared';

import { getPrompts, updatePrompt, testPrompt } from './api';

export function usePrompts() {
  return useQuery({
    queryKey: ['prompts'],
    queryFn: getPrompts,
  });
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: PromptKey; value: string }) => updatePrompt(key, value),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
}

export function useTestPrompt() {
  return useMutation({
    mutationFn: ({ key, template }: { key: PromptKey; template: string }) => testPrompt(key, template),
  });
}
