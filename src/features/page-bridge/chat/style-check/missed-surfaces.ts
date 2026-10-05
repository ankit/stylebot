import type { ChatStyleProblem } from '@stylebot/types';

import { isVisible } from '../page-outline';
import { isDark, parseColor, toHex } from './colors';
import type { Rgba } from './colors';
import { groupBySelector, MAX_PROBLEMS, pageElements } from './page';

const MAX_ELEMENTS_CHECKED = 5000;
// In px², about a 64px square: smaller backgrounds are badges and icons.
const MIN_SURFACE_AREA = 4000;

const FORM_FIELDS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);

/**
 * Backgrounds a theme missed: once the reply turned the page dark (or
 * light), visible elements whose own background is still light (or dark),
 * at least MIN_SURFACE_AREA or a form field, and not inside another one.
 */
export const findMissedSurfaces = (dark: boolean): Array<ChatStyleProblem> => {
  const flagged = new Set<Element>();
  const missed: Array<{ element: Element; detail: Rgba }> = [];

  pageElements(MAX_ELEMENTS_CHECKED, () => true).forEach(element => {
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
      missed.push({ element, detail: own });
    }
  });

  return groupBySelector(missed)
    .slice(0, MAX_PROBLEMS)
    .map(({ selector, count, detail }) => ({
      type: 'missed-surface',
      selector,
      count,
      background: toHex(detail),
      page: dark ? 'dark' : 'light',
    }));
};
