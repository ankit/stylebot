import { countMatches, elementMatches } from './reach';
import {
  getKindSelector,
  getLabelBasedSelector,
  getNameBasedSelector,
  getStableIdBasedSelector,
  getTestIdBasedSelector,
} from './element-selectors';

const NAMING_SELECTORS = [
  getTestIdBasedSelector,
  getNameBasedSelector,
  getLabelBasedSelector,
];

/**
 * `el`'s own name (or tag), and the siblings of the same tag it also fits.
 */
export const getLookAlikes = (el: HTMLElement) => {
  const own = getKindSelector(el) ?? el.tagName.toLowerCase();
  const siblings = Array.from(el.parentElement?.children ?? []).filter(
    sibling => sibling.tagName === el.tagName
  );
  const rivals = siblings.filter(
    sibling => sibling !== el && elementMatches(sibling, own)
  );

  return { own, rivals, position: siblings.indexOf(el) + 1 };
};

export type LookAlikes = ReturnType<typeof getLookAlikes>;

/**
 * An element's own name (or tag), with :nth-of-type when a sibling of the
 * same tag would match it too, e.g. `tr.athing:nth-of-type(3)`.
 */
export const getPositionedStep = ({
  own,
  rivals,
  position,
}: LookAlikes): string =>
  rivals.length ? `${own}:nth-of-type(${position})` : own;

/**
 * `el`'s step told apart from look-alike siblings by what it is before where
 * it is: its test id, name, aria-label or site address, like
 * `input[name="size"]`, and failing those its position, like
 * `tr.athing:nth-of-type(3)`.
 */
const getDistinguishedStep = (el: HTMLElement): string => {
  const lookAlikes = getLookAlikes(el);
  const { own, rivals } = lookAlikes;
  if (rivals.length === 0) {
    return own;
  }

  const named = NAMING_SELECTORS.map(getNamed => getNamed(el)).find(
    selector =>
      selector && rivals.every(rival => !elementMatches(rival, selector))
  );

  return named ?? getPositionedStep(lookAlikes);
};

/**
 * Leaves out each ancestor step `el` is still singled out without, keeping
 * any #id it's anchored at, e.g. `#menu div ul li.item:nth-of-type(3) a` →
 * `#menu li.item:nth-of-type(3) a`.
 */
const dropRedundantSteps = (steps: Array<string>): Array<string> => {
  let kept = steps;

  for (let i = kept.length - 2; i >= 0; i--) {
    const without = [...kept.slice(0, i), ...kept.slice(i + 1)];

    if (!kept[i].startsWith('#') && countMatches(without.join(' ')) === 1) {
      kept = without;
    }
  }

  return kept;
};

/**
 * A selector matching only `el`: its path up to the nearest unique #id,
 * leaving out steps that don't narrow it.
 */
export const getUniqueSelector = (el: HTMLElement): string | null => {
  const steps: Array<string> = [];

  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    const id = getStableIdBasedSelector(node);
    const step = id && countMatches(id) === 1 ? id : getDistinguishedStep(node);

    steps.unshift(step);

    if (countMatches(steps.join(' ')) === 1) {
      return dropRedundantSteps(steps).join(' ');
    }
  }

  return null;
};

/**
 * Elements like `el` within the nearest repeated ancestor it sits in (a
 * row, list item or card), e.g. every link in this one row: a step between
 * just this element and all of its kind.
 */
export const getItemScopedSelector = (el: HTMLElement): string | null => {
  const subject = getKindSelector(el) ?? el.tagName.toLowerCase();
  let ancestor = el.parentElement;

  for (let level = 0; ancestor && level < 6; level++) {
    if (ancestor === document.body || ancestor === document.documentElement) {
      return null;
    }

    if (getLookAlikes(ancestor).rivals.length > 0) {
      const item = getUniqueSelector(ancestor);
      return item ? `${item} ${subject}` : null;
    }

    ancestor = ancestor.parentElement;
  }

  return null;
};
