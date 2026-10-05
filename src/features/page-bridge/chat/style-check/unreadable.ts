import type { ChatCssEdit, ChatStyleProblem } from '@stylebot/types';

import { countMatches } from '../count-matches';
import { isVisible } from '../page-outline';
import { hasStatePseudo } from '../state-pseudos';
import { minimumContrast, parseColor, textContrast, toHex } from './colors';
import type { Rgba } from './colors';
import { groupBySelector, MAX_PROBLEMS, selectorOf } from './page';

/**
 * Which of the edits painted the background behind the element: the first
 * that sets a background on the nearest ancestor showing one.
 */
const paintedBy = (
  element: Element,
  edits: Array<ChatCssEdit>
): string | undefined => {
  let surface: Element | null = element;

  while (surface) {
    const style = getComputedStyle(surface);
    const color = parseColor(style.backgroundColor);

    if ((color && color[3] > 0) || style.backgroundImage !== 'none') {
      break;
    }

    surface = surface.parentElement;
  }

  if (!surface) {
    return undefined;
  }

  return edits.find(({ selector, declarations }) => {
    if (
      hasStatePseudo(selector) ||
      !declarations.some(({ property }) => property.startsWith('background'))
    ) {
      return false;
    }

    try {
      return (surface as Element).matches(selector);
    } catch {
      return false;
    }
  })?.selector;
};

/**
 * The text colors the edits set, each with where it was set: a variable's
 * name, or the selector of a `color` declaration. Variables come first,
 * since changing one fixes every text that uses it.
 */
const textColorSources = (
  edits: Array<ChatCssEdit>
): Array<{ source: string; color: string }> => {
  const probe = document.createElement('div');
  probe.style.setProperty('display', 'none');
  document.documentElement.appendChild(probe);

  const resolve = (value: string): string | null => {
    probe.style.removeProperty('color');
    probe.style.setProperty('color', value);

    if (!probe.style.getPropertyValue('color')) {
      return null;
    }

    const color = parseColor(getComputedStyle(probe).color);
    return color?.[3] === 1 ? toHex(color) : null;
  };

  const declarations = edits.flatMap(({ selector, declarations }) =>
    declarations.map(declaration => ({ selector, ...declaration }))
  );
  const sources = [
    ...declarations
      .filter(({ property }) => property.startsWith('--'))
      .map(({ property, value }) => ({ source: property, value })),
    ...declarations
      .filter(
        ({ selector, property }) =>
          property === 'color' && !hasStatePseudo(selector)
      )
      .map(({ selector, value }) => ({ source: selector, value })),
  ].flatMap(({ source, value }) => {
    const color = value.includes('var(') ? null : resolve(value);
    return color ? [{ source, color }] : [];
  });

  probe.remove();
  return sources;
};

/**
 * Text the edits made hard to read, grouped by the selector that names it,
 * or by the reply's variable that colors it.
 */
export const findUnreadable = (
  before: Map<Element, number>,
  resolveBackground: (element: Element) => Rgba | null,
  edits: Array<ChatCssEdit>
): Array<ChatStyleProblem> => {
  const worse: Array<{
    element: Element;
    detail: {
      ratio: number;
      color: Rgba;
      background: Rgba;
    };
  }> = [];

  before.forEach((ratioBefore, element) => {
    if (!element.isConnected || !isVisible(element)) {
      return;
    }

    const now = textContrast(element, resolveBackground);

    // Only text this reply made harder to read; the page's own faint text
    // isn't the reply's to fix.
    if (
      now &&
      now.ratio < minimumContrast(element) &&
      now.ratio < ratioBefore - 0.5
    ) {
      worse.push({ element, detail: now });
    }
  });

  if (!worse.length) {
    return [];
  }

  const colors = textColorSources(edits);
  const sourceOf = (color: Rgba) =>
    colors.find(source => source.color === toHex(color))?.source;
  const byVariable = new Map<string, typeof worse>();
  const rest: typeof worse = [];

  // Text one of the reply's variables colors is reported once for all of
  // it, so a fix changes the variable rather than the few elements listed.
  worse.forEach(item => {
    const source = sourceOf(item.detail.color);

    if (source?.startsWith('--')) {
      byVariable.set(source, [...(byVariable.get(source) ?? []), item]);
    } else {
      rest.push(item);
    }
  });

  const problem = (
    selector: string,
    count: number,
    of: number,
    { element, detail }: (typeof worse)[number]
  ): ChatStyleProblem => {
    const painter = paintedBy(element, edits);
    const colorer = sourceOf(detail.color);

    return {
      type: 'unreadable',
      selector,
      count,
      of,
      color: toHex(detail.color),
      background: toHex(detail.background),
      ratio: Math.round(detail.ratio * 10) / 10,
      ...(painter ? { paintedBy: painter } : {}),
      ...(colorer ? { coloredBy: colorer } : {}),
    };
  };

  const variableProblems = Array.from(byVariable.values()).map(items => {
    const worst = items.reduce((a, b) =>
      b.detail.ratio < a.detail.ratio ? b : a
    );
    return problem(
      selectorOf(worst.element),
      items.length,
      items.length,
      worst
    );
  });

  const selectorProblems = groupBySelector(rest)
    .sort((a, b) => a.detail.ratio - b.detail.ratio)
    .map(({ selector, count, element, detail }) =>
      problem(selector, count, countMatches([selector])[0] ?? 0, {
        element,
        detail,
      })
    );

  return [...variableProblems, ...selectorProblems].slice(0, MAX_PROBLEMS);
};
