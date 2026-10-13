import { getSelector } from '@stylebot/css';

import { isDark, parseColor, WHITE } from './colors';
import type { Rgba } from './colors';

// How many problems of each kind are reported.
export const MAX_PROBLEMS = 6;

const SETTLE_TIMEOUT = 1000;

const SKIPPED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'svg',
  'IMG',
  'VIDEO',
  'CANVAS',
  'PICTURE',
  'IFRAME',
]);

const isPageElement = (element: Element): boolean =>
  !SKIPPED_TAGS.has(element.tagName) && element.id !== 'stylebot';

export const hasOwnText = (element: Element): boolean =>
  Array.from(element.childNodes).some(
    node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
  );

/**
 * The page's elements in document order, skipping Stylebot's UI and the
 * insides of media and scripts, up to a limit.
 */
export const pageElements = (
  limit: number,
  keep: (element: Element) => boolean
) => {
  const found: Array<Element> = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: node =>
        isPageElement(node as Element)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    }
  );

  while (found.length < limit && walker.nextNode()) {
    const element = walker.currentNode as Element;

    if (keep(element)) {
      found.push(element);
    }
  }

  return found;
};

const pageBackground = (): Rgba => {
  const body = parseColor(getComputedStyle(document.body).backgroundColor);

  if (body && body[3] > 0) {
    return body;
  }

  const root = parseColor(
    getComputedStyle(document.documentElement).backgroundColor
  );
  return root && root[3] > 0 ? root : WHITE;
};

export const pageIsDark = (): boolean | null => isDark(pageBackground());

const nextFrame = (): Promise<void> =>
  new Promise(resolve => requestAnimationFrame(() => resolve()));

/**
 * Waits for the new styles to paint and any transitions they started to
 * end, since computed values read mid-transition are the old ones.
 */
export const settle = async (): Promise<void> => {
  const timeout = new Promise<void>(resolve =>
    setTimeout(resolve, SETTLE_TIMEOUT)
  );

  await Promise.race([nextFrame().then(nextFrame), timeout]);

  const transitions = document
    .getAnimations()
    .filter(
      animation =>
        typeof CSSTransition !== 'undefined' &&
        animation instanceof CSSTransition
    )
    .map(animation => animation.finished.catch(() => undefined));

  await Promise.race([Promise.all(transitions), timeout]);
};

export const selectorOf = (element: Element): string =>
  element instanceof HTMLElement ? getSelector(element) : '';

/**
 * Groups elements under the selector that names them, keeping the first
 * of each group as its example.
 */
export const groupBySelector = <T>(
  items: Array<{ element: Element; detail: T }>
) => {
  const groups = new Map<
    string,
    { count: number; element: Element; detail: T }
  >();

  items.forEach(({ element, detail }) => {
    const selector = selectorOf(element);

    if (!selector) {
      return;
    }

    const group = groups.get(selector);

    if (group) {
      group.count++;
    } else {
      groups.set(selector, { count: 1, element, detail });
    }
  });

  return Array.from(groups, ([selector, group]) => ({ selector, ...group }));
};
