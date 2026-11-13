import { getTestIdBasedSelector } from './element-selectors';
import { countMatches, matchesOf } from './reach';
import { isSimpleSelector } from './selector-text';
import { getLookAlikes, getPositionedStep } from './unique-selectors';
import type { LookAlikes } from './unique-selectors';

// Repeated blocks like a tweet sit deeper than a row's cells, so look further.
const MAX_LEVELS_UP = 12;

const POSITION = /:nth-of-type\(\d+\)/;

/**
 * One step of a path, and how it sits under the step before it: as a
 * direct child, or anywhere below once the steps between are left out.
 */
type Step = { compound: string; under: ' > ' | ' ' };

const toSelector = (path: Array<Step>): string =>
  path
    .map(({ compound, under }, i) => (i ? `${under}${compound}` : compound))
    .join('');

/**
 * Leaves out each step between the block and the element that the path
 * matches as many elements without (leaving one out only widens it, so
 * that means the same elements), e.g.
 * `tr.athing > td > span.titleline > a` → `tr.athing span.titleline > a`.
 */
const dropUnneededSteps = (path: Array<Step>, count: number): Array<Step> => {
  let kept = path;

  for (let i = 1; i < kept.length - 1; ) {
    const without = [
      ...kept.slice(0, i),
      { ...kept[i + 1], under: ' ' as const },
      ...kept.slice(i + 2),
    ];

    if (countMatches(toSelector(without)) === count) {
      kept = without;
    } else {
      i++;
    }
  }

  return kept;
};

/**
 * Leaves out each `:nth-of-type()` the path matches as many elements
 * without, e.g. `tr.athing > td:nth-of-type(3) > span.titleline` →
 * `tr.athing > td > span.titleline` when only that cell has a title.
 */
const dropUnneededPositions = (
  path: Array<Step>,
  count: number
): Array<Step> => {
  let kept = path;

  path.forEach((step, i) => {
    const compound = step.compound.replace(POSITION, '');
    const without = kept.map((other, j) =>
      j === i ? { ...other, compound } : other
    );

    if (
      compound !== step.compound &&
      countMatches(toSelector(without)) === count
    ) {
      kept = without;
    }
  });

  return kept;
};

/**
 * The path from every block `block` matches down to the element `steps`
 * lead to, as short as it gets without matching more. Null when it
 * matches fewer than two elements, so there's no group to style.
 */
const getPathFromBlock = (
  block: string,
  steps: Array<string>
): string | null => {
  const path = [block, ...steps].map(
    (compound): Step => ({ compound, under: ' > ' })
  );
  const count = countMatches(toSelector(path));
  if (count < 2) {
    return null;
  }

  return toSelector(
    dropUnneededPositions(dropUnneededSteps(path, count), count)
  );
};

/**
 * The name an ancestor shares with its look-alike siblings, like a card's
 * class, when it repeats; null when it doesn't, or has only a bare tag.
 */
const getRepeatedBlockName = (
  ancestor: HTMLElement,
  { own, rivals }: LookAlikes
): string | null =>
  rivals.length && own !== ancestor.tagName.toLowerCase() ? own : null;

/**
 * Climbs from `el` to the first ancestor `nameBlock` names whose path down
 * to `el` stays simple enough to keep working, and returns that path.
 */
const findPathFromNearestBlock = (
  el: HTMLElement,
  nameBlock: (ancestor: HTMLElement, lookAlikes: LookAlikes) => string | null
): string | null => {
  const steps = [getPositionedStep(getLookAlikes(el))];
  let ancestor = el.parentElement;

  for (let level = 0; ancestor && level < MAX_LEVELS_UP; level++) {
    if (ancestor === document.body || ancestor === document.documentElement) {
      return null;
    }

    const lookAlikes = getLookAlikes(ancestor);
    const block = nameBlock(ancestor, lookAlikes);
    const path = block && getPathFromBlock(block, steps);

    if (path && isSimpleSelector(path)) {
      return path;
    }

    steps.unshift(getPositionedStep(lookAlikes));
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
  findPathFromNearestBlock(el, getRepeatedBlockName);

/**
 * A test id that includes one item's name, like `avatar-alice`, cut to the
 * start every item shares (`avatar-`), when everything with that start is
 * the same component (same tag and classes) and it matches more elements.
 */
const generalizeTestId = (el: HTMLElement, selector: string): string => {
  const parts = selector.match(/^([a-z0-9-]+)\[([a-z-]+)="(.*)"\]$/i);
  const cut = parts ? parts[3].search(/[-_:][^-_:]+$/) : -1;
  if (!parts || cut <= 0) {
    return selector;
  }

  const [, tag, attribute, value] = parts;
  const prefix = `${tag}[${attribute}^="${value.slice(0, cut + 1)}"]`;
  const all = matchesOf(prefix);
  const sameComponent = all.every(other => other.className === el.className);

  if (!sameComponent || all.length <= countMatches(selector)) {
    return selector;
  }

  return prefix;
};

// Roles that say what an element is, shared by every one of its kind; not
// the ones that mean "nothing here", like `presentation`.
const MEANINGFUL_ROLES = new Set([
  'article',
  'button',
  'cell',
  'columnheader',
  'dialog',
  'gridcell',
  'heading',
  'link',
  'listitem',
  'menuitem',
  'navigation',
  'option',
  'row',
  'tab',
  'tablist',
  'toolbar',
  'treeitem',
]);

/**
 * An element's hook for scoping what's inside it: its test id, widened when
 * made for one item, else a role that says what it is, like `[role="tab"]`.
 */
const getHook = (el: HTMLElement): string | null => {
  const testId = getTestIdBasedSelector(el);
  if (testId) {
    return generalizeTestId(el, testId);
  }

  const role = el.getAttribute('role');

  if (!role || !MEANINGFUL_ROLES.has(role)) {
    return null;
  }

  return `${el.tagName.toLowerCase()}[role="${role}"]`;
};

/**
 * The element in its spot inside every ancestor sharing a test id or role,
 * for blocks named by those rather than a class, e.g. every item's avatar:
 * `div[role="listitem"] div[data-testid^="avatar-"] img`.
 */
export const getHookScopedSelector = (el: HTMLElement): string | null =>
  findPathFromNearestBlock(el, getHook);
