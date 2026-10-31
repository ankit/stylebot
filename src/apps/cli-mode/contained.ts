import {
  getExistingSelector,
  getSelector,
  getUniqueSelector,
} from '@stylebot/css';
import { countMatches } from '@stylebot/page-bridge';
import type { CliMark, CliMarkedElement, ViewportRect } from '@stylebot/types';

import type { Point } from './areas';

// Most elements a mark lists.
const MAX_ELEMENTS = 8;
// How far an element may overhang an area and still count as inside it.
const SLACK = 4;

type Box = Pick<
  DOMRect,
  'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'
>;

const isOurs = (el: Element): boolean => el.tagName.startsWith('STYLEBOT-');

const isShown = (el: Element, box: Box): boolean =>
  box.width > 0 && box.height > 0 && (el.checkVisibility?.() ?? true);

const isInside = (box: Box, rect: ViewportRect): boolean =>
  box.left >= rect.x - SLACK &&
  box.top >= rect.y - SLACK &&
  box.right <= rect.x + rect.width + SLACK &&
  box.bottom <= rect.y + rect.height + SLACK;

const holds = (box: Box, { x, y }: Point): boolean =>
  box.left <= x && x < box.right && box.top <= y && y < box.bottom;

/**
 * The outermost shown elements wholly inside a box of the viewport, in
 * document order. Every element is looked at, so a positioned child counts
 * even when its parent's box is elsewhere.
 */
export const findContained = (
  rect: ViewportRect,
  root: Element = document.body
): Array<Element> => {
  const found: Array<Element> = [];

  const visit = (parent: Element): void => {
    for (const child of Array.from(parent.children)) {
      if (isOurs(child)) {
        continue;
      }

      const box = child.getBoundingClientRect();

      if (isInside(box, rect) && isShown(child, box)) {
        found.push(child);
      } else {
        visit(child);
      }
    }
  };

  visit(root);
  return found;
};

/**
 * The innermost shown element whose box holds a point of the viewport.
 */
const findDeepestAt = (point: Point, root: Element): Element | null => {
  for (const child of Array.from(root.children).reverse()) {
    if (isOurs(child)) {
      continue;
    }

    const inner = findDeepestAt(point, child);

    if (inner) {
      return inner;
    }

    const box = child.getBoundingClientRect();

    if (holds(box, point) && isShown(child, box)) {
      return child;
    }
  }

  return null;
};

/**
 * The element at the middle of a box of the viewport: the one painted there
 * while it's in view, else the innermost one there.
 */
export const findAtMiddle = (
  rect: ViewportRect,
  root: Element = document.body
): Element | null => {
  const middle = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  const inView =
    middle.x >= 0 &&
    middle.y >= 0 &&
    middle.x < innerWidth &&
    middle.y < innerHeight;
  const painted = inView
    ? document.elementFromPoint?.(middle.x, middle.y)
    : null;

  if (painted && !isOurs(painted) && root.contains(painted)) {
    return painted;
  }

  return findDeepestAt(middle, root);
};

/**
 * An element as a mark lists it: the selector the inspector would pick,
 * preferring one the css has, with how many elements it matches, and one
 * for it alone when that matches others too.
 */
const describeElement = (el: Element, css: string): CliMarkedElement => {
  const selector =
    getExistingSelector(el as HTMLElement, css) ??
    getSelector(el as HTMLElement);
  const [matches] = countMatches([selector]);
  const unique = matches === 1 ? null : getUniqueSelector(el as HTMLElement);

  return unique ? { selector, matches, unique } : { selector, matches };
};

/**
 * What a mark over a box of the viewport holds: the outermost elements
 * wholly inside it, or when none is, the element at its middle.
 */
export const describeArea = (
  rect: ViewportRect,
  css: string
): Pick<CliMark, 'elements' | 'whole' | 'more'> => {
  const contained = findContained(rect);

  if (contained.length) {
    return {
      elements: contained
        .slice(0, MAX_ELEMENTS)
        .map(el => describeElement(el, css)),
      whole: true,
      more: Math.max(contained.length - MAX_ELEMENTS, 0),
    };
  }

  const middle = findAtMiddle(rect);

  return {
    elements: middle ? [describeElement(middle, css)] : [],
    whole: false,
    more: 0,
  };
};
