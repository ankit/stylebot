import type { ChatStyleProblem } from '@stylebot/types';

import { isVisible } from '../page-outline';
import { isDark, parseColor, toHex } from './colors';
import type { Rgba } from './colors';
import { groupBySelector, MAX_PROBLEMS, pageElements } from './page';

const MAX_SURFACE_ELEMENTS = 5000;
const MIN_SURFACE_AREA = 4000;

const FORM_FIELDS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);

/**
 * Surfaces still in the page's old lightness once a reply turned the page
 * dark or light: the cards and panels a new theme missed.
 */
export const findClashing = (dark: boolean): Array<ChatStyleProblem> => {
  const flagged = new Set<Element>();
  const clashing: Array<{ element: Element; detail: Rgba }> = [];

  pageElements(MAX_SURFACE_ELEMENTS, () => true).forEach(element => {
    const own = parseColor(getComputedStyle(element).backgroundColor);

    if (!own || own[3] < 0.9 || isDark(own) !== !dark) {
      return;
    }

    for (let up = element.parentElement; up; up = up.parentElement) {
      if (flagged.has(up)) {
        return;
      }
    }

    const { width, height } = element.getBoundingClientRect();

    if (
      (width * height >= MIN_SURFACE_AREA ||
        FORM_FIELDS.has(element.tagName)) &&
      isVisible(element)
    ) {
      flagged.add(element);
      clashing.push({ element, detail: own });
    }
  });

  return groupBySelector(clashing)
    .slice(0, MAX_PROBLEMS)
    .map(({ selector, count, detail }) => ({
      type: 'clashing',
      selector,
      count,
      background: toHex(detail),
      page: dark ? 'dark' : 'light',
    }));
};
