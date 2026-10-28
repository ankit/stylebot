import type { StyleProblem } from '@stylebot/types';

import type { RuleChanges } from './style-check';

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
 * A rule as the report names it: its selector, and the at-rules it sits in
 * when it sits in any, as `.title (in @media print)`.
 */
export const describeRule = (selector: string, context: string): string =>
  context ? `${selector} (in ${context})` : selector;

/**
 * A heading over how many elements each selector matched, with a hint when
 * one matched nothing; empty when no selector is listed.
 */
const describeMatchList = (
  heading: string,
  entries: Array<{ selector: string; count: number | null }>
): Array<string> => {
  if (!entries.length) {
    return [];
  }

  const lines = entries.map(
    ({ selector, count }) => `- ${selector}: ${describeCount(count)}`
  );
  const matchedNothing = entries.some(({ count }) => !count);

  return [
    heading,
    ...lines,
    matchedNothing
      ? 'Edits whose selector matched nothing changed nothing.'
      : '',
  ];
};

/**
 * How many elements the rules added or changed since the last save matched,
 * the rules removed, and how many rules it left out as unchanged.
 */
const describeChanges = (
  selectors: Array<string>,
  matches: Array<number | null>,
  { changed, removed }: RuleChanges
): Array<string> => {
  if (!changed.length && !removed.length) {
    return ['No rules changed since the last save.'];
  }

  const changedLines = describeMatchList(
    'Elements each added or changed rule matched:',
    changed.map(({ index, context }) => ({
      selector: describeRule(selectors[index], context),
      count: matches[index],
    }))
  );

  const removedLines = removed.length
    ? [
        'Removed rules:',
        ...removed.map(
          ({ selector, context }) => `- ${describeRule(selector, context)}`
        ),
      ]
    : [];

  const unchanged = selectors.length - changed.length;
  const ruleWord = unchanged === 1 ? 'rule' : 'rules';
  const unchangedLine = unchanged
    ? `${unchanged} unchanged ${ruleWord} not listed`
    : '';

  return [...changedLines, ...removedLines, unchangedLine];
};

/**
 * How many elements each selector matched, every one of them.
 */
const describeAllMatches = (
  selectors: Array<string>,
  matches: Array<number | null>
): Array<string> =>
  describeMatchList(
    'Elements each selector matched:',
    selectors.map((selector, index) => ({ selector, count: matches[index] }))
  );

/**
 * How many elements the selectors matched: only the changed rules' when
 * given the changes since the last save, else every selector's.
 */
const describeMatches = (
  selectors: Array<string>,
  matches?: Array<number | null>,
  changes?: RuleChanges | null
): Array<string> => {
  if (!matches?.length) {
    return [];
  }

  return changes
    ? describeChanges(selectors, matches, changes)
    : describeAllMatches(selectors, matches);
};

/**
 * What the page check found once css applied, as the CLI prints it: how
 * many elements each selector matched, and the problems it made. Given the
 * rules changed since the last save, it counts only theirs. Empty when
 * nothing was checked.
 */
export const describeStyleCheck = (
  selectors: Array<string>,
  matches?: Array<number | null>,
  problems?: Array<StyleProblem>,
  changes?: RuleChanges | null
): string =>
  [
    ...describeMatches(selectors, matches, changes),
    problems?.length ? 'Problems the page check found:' : '',
    ...(problems ?? []).map(describeProblem),
  ]
    .filter(Boolean)
    .join('\n');
