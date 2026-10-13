import type { StyleProblem } from '@stylebot/types';

const describeCount = (count: number | null | undefined): string => {
  if (count === null) {
    return 'not a valid selector';
  }

  return count === 1 ? '1 element' : `${count} elements`;
};

const describeProblem = (problem: StyleProblem): string => {
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
 * What the page check found once css applied, as the CLI prints it: how
 * many elements each selector matched, and the problems it made. Empty when
 * nothing was checked.
 */
export const describeStyleCheck = (
  selectors: Array<string>,
  matches?: Array<number | null>,
  problems?: Array<StyleProblem>
): string =>
  [
    matches?.length ? 'Elements each selector matched:' : '',
    ...(matches
      ? selectors.map(
          (selector, index) => `- ${selector}: ${describeCount(matches[index])}`
        )
      : []),
    matches?.some(count => !count)
      ? 'Edits whose selector matched nothing changed nothing.'
      : '',
    problems?.length ? 'Problems the page check found:' : '',
    ...(problems ?? []).map(describeProblem),
  ]
    .filter(Boolean)
    .join('\n');
