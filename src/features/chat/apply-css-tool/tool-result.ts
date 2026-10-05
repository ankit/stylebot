import type {
  ChatAssistantTurn,
  ChatReplyRound,
  ChatStyleProblem,
} from '@stylebot/types';

import { TOOL_RESULT_APPLIED, TOOL_RESULT_UNDONE } from './schema';

const describeCount = (count: number | null | undefined): string => {
  if (count === null) {
    return 'not a valid selector';
  }

  return count === 1 ? '1 element' : `${count} elements`;
};

const describeProblem = (problem: ChatStyleProblem): string => {
  switch (problem.type) {
    case 'unreadable-text':
      if (problem.coloredBy?.startsWith('--')) {
        return `- Hard to read: ${describeCount(
          problem.count
        )} colored by your \`${problem.coloredBy}\` (${
          problem.color
        }), such as ${problem.selector} on ${problem.background}, contrast ${
          problem.ratio
        }:1`;
      }

      return `- Hard to read: ${problem.selector} (${
        problem.of > problem.count
          ? `${problem.count} of the ${problem.of} elements it matches`
          : describeCount(problem.count)
      }), text ${problem.color}${
        problem.coloredBy ? ` set by your \`${problem.coloredBy}\`` : ''
      } on ${problem.background}${
        problem.paintedBy ? ` painted by your \`${problem.paintedBy}\`` : ''
      }, contrast ${problem.ratio}:1`;
    case 'missed-surface':
      return `- Still ${problem.page === 'dark' ? 'light' : 'dark'} on a now ${
        problem.page
      } page: ${problem.selector} (${describeCount(
        problem.count
      )}), background ${problem.background}`;
    case 'overridden-declaration':
      return `- No effect: ${problem.property}: ${problem.value} on ${problem.selector}, overridden by the page or not applicable to that element`;
  }
};

/**
 * How many more apply_css calls a reply may make, after its first, to fix
 * what the previous call left wrong.
 */
export const MAX_FIX_ROUNDS = 1;

/**
 * Whether a call left something for the model to fix on another call: a
 * problem the page check found, or a selector that matched nothing.
 */
export const needsFix = (round: ChatReplyRound): boolean =>
  Boolean(round.problems?.length) ||
  Boolean(round.matches?.some(count => !count));

/**
 * The id of one of a reply's apply_css calls: the reply's own for its
 * first call, as threads saved before fix rounds have it, then numbered.
 */
export const roundCallId = (
  prefix: string,
  turnId: string,
  round: number
): string => (round ? `${prefix}_${turnId}_${round}` : `${prefix}_${turnId}`);

/**
 * Each apply_css call a reply made, in order: its rounds, or the reply
 * itself when it made one call.
 */
export const roundsOf = (turn: ChatAssistantTurn): Array<ChatReplyRound> =>
  turn.rounds ?? [
    {
      text: turn.text,
      edits: turn.edits,
      matches: turn.matches,
      replay: turn.replay,
    },
  ];

/**
 * What the model is told one of a reply's apply_css calls came to: applied
 * or undone, how many elements each selector matched, and the problems the
 * page check found, so a selector that missed or a color that won't read
 * shows on its next call.
 */
export const toolResultFor = (
  turn: ChatAssistantTurn,
  round: ChatReplyRound
): string => {
  if (!turn.applied) {
    return TOOL_RESULT_UNDONE;
  }

  const { matches, problems } = round;
  const lines = matches
    ? round.edits.map(
        (edit, index) => `- ${edit.selector}: ${describeCount(matches[index])}`
      )
    : [];
  const missed = matches?.some(count => !count);

  return [
    TOOL_RESULT_APPLIED,
    lines.length ? 'Elements each selector matched:' : '',
    ...lines,
    missed ? 'Edits whose selector matched nothing changed nothing.' : '',
    problems?.length ? 'Problems the page check found:' : '',
    ...(problems ?? []).map(describeProblem),
  ]
    .filter(Boolean)
    .join('\n');
};
