import type { SessionResultDto } from '@archetypes/shared';
import { ARCHETYPES } from '@archetypes/shared';

import type { Messages } from '../../locales/index.js';
import { escapeHtml } from '../../utils/helpers.js';

export function formatResult(result: SessionResultDto, messages: Messages): string {
  const lines: string[] = [];

  lines.push(`<b>${messages.result.title}</b>\n`);

  // Сортируем по скору (от большего к меньшему)
  const sortedScores = [...result.scores].sort((a, b) => b.finalScore - a.finalScore);

  for (const score of sortedScores) {
    const archetype = ARCHETYPES[score.archetypeCode];
    const emoji = archetype?.emoji ?? '•';
    const strengthIcon = getStrengthIcon(score.strength);

    lines.push(`${emoji} ${strengthIcon} ${score.archetypeName}: <b>${score.finalScore.toFixed(1)}</b>/10`);
  }

  if (result.playerSummary) {
    lines.push('');
    lines.push(`<b>${messages.result.summary}</b>`);
    lines.push(escapeHtml(result.playerSummary));
  }

  return lines.join('\n');
}

function getStrengthIcon(strength: string): string {
  switch (strength) {
    case 'dominant':
      return '🟢';
    case 'moderate':
      return '🟡';
    case 'weak':
      return '🟠';
    case 'absent':
      return '⚪';
    default:
      return '•';
  }
}

export function formatArchetypeScore(
  name: string,
  score: number,
  strength: string
): string {
  const strengthIcon = getStrengthIcon(strength);
  return `${strengthIcon} ${name}: ${score.toFixed(1)}/10`;
}
