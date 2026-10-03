import type { ChatAssistantTurn } from '@stylebot/types';

import { TOOL_RESULT_APPLIED, TOOL_RESULT_UNDONE } from './schema';

const describeCount = (count: number | null | undefined): string => {
  if (count === null) {
    return 'not a valid selector';
  }

  return count === 1 ? '1 element' : `${count} elements`;
};

/**
 * What the model is told its apply_css call came to: applied or undone,
 * and how many elements each selector matched, so a selector that missed
 * or swept up far too much shows on its next turn.
 */
export const toolResultFor = (turn: ChatAssistantTurn): string => {
  if (!turn.applied) {
    return TOOL_RESULT_UNDONE;
  }

  const { matches } = turn;

  if (!matches) {
    return TOOL_RESULT_APPLIED;
  }

  const lines = turn.edits.map(
    (edit, index) => `- ${edit.selector}: ${describeCount(matches[index])}`
  );
  const missed = matches.some(count => !count);

  return [
    TOOL_RESULT_APPLIED,
    'Elements each selector matched:',
    ...lines,
    missed ? 'Edits whose selector matched nothing changed nothing.' : '',
  ]
    .filter(Boolean)
    .join('\n');
};
