import { matchesOf, sameElements } from './reach';
import { getKindSelector } from './element-selectors';
import { isSimpleSelector } from './selector-text';
import { getPositionedStep } from './unique-selectors';

// Repeated blocks like a tweet sit deeper than a row's cells, so look further.
const MAX_LEVELS = 12;

const POSITION = /:nth-of-type\(\d+\)/;

/**
 * Renders steps joined by their combinators, `joins[i]` sitting between
 * `steps[i]` and `steps[i + 1]`.
 */
const renderPath = (steps: Array<string>, joins: Array<string>): string =>
  steps.map((step, i) => (i ? `${joins[i - 1]}${step}` : step)).join('');

/**
 * The element at the end of `steps` under every match of `scope`, with
 * each step in between and each position left out that it still matches
 * the same elements without. Null when it matches fewer than two.
 */
const getPathUnder = (scope: string, steps: Array<string>): string | null => {
  let path = [scope, ...steps];
  let joins = steps.map(() => ' > ');
  const target = matchesOf(renderPath(path, joins));
  if (target.length < 2) {
    return null;
  }

  const matchesTarget = (candidate: string) =>
    sameElements(matchesOf(candidate), target);

  for (let i = 1; i < path.length - 1; ) {
    const shorterPath = [...path.slice(0, i), ...path.slice(i + 1)];
    const shorterJoins = [...joins.slice(0, i - 1), ' ', ...joins.slice(i + 1)];

    if (matchesTarget(renderPath(shorterPath, shorterJoins))) {
      path = shorterPath;
      joins = shorterJoins;
    } else {
      i++;
    }
  }

  path.forEach((step, i) => {
    const unpositioned = [...path];
    unpositioned[i] = step.replace(POSITION, '');

    if (
      unpositioned[i] !== step &&
      matchesTarget(renderPath(unpositioned, joins))
    ) {
      path = unpositioned;
    }
  });

  return renderPath(path, joins);
};

/**
 * A repeated ancestor's own name, like a card's class, when its siblings
 * look the same (its step needed a position); null for a bare tag.
 */
const getRepeatedBlock = (
  ancestor: HTMLElement,
  step: string
): string | null => {
  if (!step.includes(':nth-of-type(')) {
    return null;
  }

  return getKindSelector(ancestor);
};

/**
 * Climbs from `el` building the path down to it, and returns the shortest
 * path under the first ancestor `anchorFor` names that is simple enough to
 * keep working; `anchorFor` gets each ancestor and its positioned step.
 */
const getPathUnderAnchor = (
  el: HTMLElement,
  anchorFor: (ancestor: HTMLElement, step: string) => string | null
): string | null => {
  const steps = [getPositionedStep(el)];
  let ancestor = el.parentElement;

  for (let level = 0; ancestor && level < MAX_LEVELS; level++) {
    if (ancestor === document.body || ancestor === document.documentElement) {
      return null;
    }

    const step = getPositionedStep(ancestor);
    const anchor = anchorFor(ancestor, step);
    const path = anchor && getPathUnder(anchor, steps);

    if (path && isSimpleSelector(path)) {
      return path;
    }

    steps.unshift(step);
    ancestor = ancestor.parentElement;
  }

  return null;
};

/**
 * The element in the same spot of every block like the one `el` sits in,
 * e.g. the title of every story: the path down from the nearest repeated
 * ancestor with a name of its own (not a bare `p`), without pinning which
 * one.
 */
export const getSameSpotSelector = (el: HTMLElement): string | null =>
  getPathUnderAnchor(el, getRepeatedBlock);
