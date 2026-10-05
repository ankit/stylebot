import { getSelector } from '@stylebot/css';
import type { ChatCssEdit, ChatStyleProblem } from '@stylebot/types';

import { countMatches, queryPage } from './count-matches';
import { isVisible } from './page-outline';
import { hasStatePseudo } from './state-pseudos';

const MAX_TEXT_ELEMENTS = 1500;
const MAX_SURFACE_ELEMENTS = 5000;
const MAX_SAMPLES = 3;
const MAX_PROBLEMS = 6;
const SETTLE_TIMEOUT = 1000;
const MIN_SURFACE_AREA = 4000;

// Properties that can change how text reads against what's behind it.
const CONTRAST_PROPERTY = /^(?:--|color$|background|all$|opacity$|filter$)/;

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

const FORM_FIELDS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);

type Rgba = [number, number, number, number];

type Sample = {
  selector: string;
  property: string;
  value: string;
  elements: Array<Element>;
  before: Array<string>;
};

type Baseline = {
  edits: Array<ChatCssEdit>;
  contrast: Map<Element, number>;
  dark: boolean | null;
  samples: Array<Sample>;
};

let baseline: Baseline | null = null;

/**
 * A computed color as channels 0–255 and alpha 0–1, or null for one in a
 * color space this doesn't read.
 */
const parseColor = (value: string): Rgba | null => {
  const rgb =
    /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(value);

  if (rgb) {
    return [
      Number(rgb[1]),
      Number(rgb[2]),
      Number(rgb[3]),
      rgb[4] === undefined ? 1 : Number(rgb[4]),
    ];
  }

  const srgb =
    /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/.exec(value);

  if (srgb) {
    return [
      Number(srgb[1]) * 255,
      Number(srgb[2]) * 255,
      Number(srgb[3]) * 255,
      srgb[4] === undefined ? 1 : Number(srgb[4]),
    ];
  }

  return null;
};

const blend = (top: Rgba, bottom: Rgba): Rgba => {
  const alpha = top[3];
  return [
    top[0] * alpha + bottom[0] * (1 - alpha),
    top[1] * alpha + bottom[1] * (1 - alpha),
    top[2] * alpha + bottom[2] * (1 - alpha),
    1,
  ];
};

const luminance = ([r, g, b]: Rgba): number => {
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

const contrastRatio = (a: Rgba, b: Rgba): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

/**
 * Whether a color reads as dark or light; null for the mid-tones between.
 */
const isDark = (color: Rgba): boolean | null => {
  const value = luminance(color);

  if (value < 0.18) {
    return true;
  }

  return value > 0.4 ? false : null;
};

const toHex = ([r, g, b]: Rgba): string =>
  `#${[r, g, b]
    .map(channel => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`;

const WHITE: Rgba = [255, 255, 255, 1];

/**
 * Resolves what's painted behind each element, through its translucent
 * ancestors down to the canvas; null under a background image, where the
 * color can't be known. Memoised for one pass over the page.
 */
const backgroundResolver = () => {
  const cache = new Map<Element, Rgba | null>();

  const resolve = (element: Element | null): Rgba | null => {
    if (!element) {
      return WHITE;
    }

    if (cache.has(element)) {
      return cache.get(element) as Rgba | null;
    }

    const style = getComputedStyle(element);
    let result: Rgba | null;

    if (style.backgroundImage && style.backgroundImage !== 'none') {
      result = null;
    } else {
      const own = parseColor(style.backgroundColor);

      if (own && own[3] >= 1) {
        result = own;
      } else {
        const behind = resolve(element.parentElement);
        result = behind && own && own[3] > 0 ? blend(own, behind) : behind;
      }
    }

    cache.set(element, result);
    return result;
  };

  return resolve;
};

const isPageElement = (element: Element): boolean =>
  !SKIPPED_TAGS.has(element.tagName) && element.id !== 'stylebot';

const hasOwnText = (element: Element): boolean =>
  Array.from(element.childNodes).some(
    node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
  );

/**
 * The page's elements in document order, skipping Stylebot's UI and the
 * insides of media and scripts, up to a limit.
 */
const pageElements = (limit: number, keep: (element: Element) => boolean) => {
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

const textContrast = (
  element: Element,
  resolveBackground: (element: Element) => Rgba | null
): { ratio: number; color: Rgba; background: Rgba } | null => {
  const color = parseColor(getComputedStyle(element).color);
  const background = resolveBackground(element);

  if (!color || !background || color[3] === 0) {
    return null;
  }

  const shown = color[3] < 1 ? blend(color, background) : color;
  return {
    ratio: contrastRatio(shown, background),
    color: shown,
    background,
  };
};

// WCAG's thresholds: 3:1 is enough for large text, 4.5:1 for the rest.
const minimumContrast = (element: Element): number => {
  const style = getComputedStyle(element);
  const size = parseFloat(style.fontSize);
  const bold = Number(style.fontWeight) >= 700;
  return size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
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

const pageIsDark = (): boolean | null => isDark(pageBackground());

const sampleEdits = (edits: Array<ChatCssEdit>): Array<Sample> =>
  edits.flatMap(({ selector, declarations }) => {
    if (hasStatePseudo(selector)) {
      return [];
    }

    const elements = queryPage(selector, MAX_SAMPLES);

    if (!elements?.length) {
      return [];
    }

    return declarations
      .filter(({ property, value }) => value && !property.startsWith('--'))
      .map(({ property, value }) => ({
        selector,
        property,
        value,
        elements,
        before: elements.map(element =>
          getComputedStyle(element).getPropertyValue(property)
        ),
      }));
  });

/**
 * Notes what the page looks like before a reply's edits are applied: each
 * text's contrast, whether the page is dark, and the current values of
 * the properties the edits set, for checkStyle to compare against.
 */
export const startStyleCheck = (edits: Array<ChatCssEdit>): void => {
  const resolveBackground = backgroundResolver();
  const contrast = new Map<Element, number>();
  const recolors = edits.some(({ declarations }) =>
    declarations.some(({ property }) => CONTRAST_PROPERTY.test(property))
  );

  if (recolors) {
    pageElements(
      MAX_TEXT_ELEMENTS,
      element => hasOwnText(element) && isVisible(element)
    ).forEach(element => {
      const result = textContrast(element, resolveBackground);

      if (result) {
        contrast.set(element, result.ratio);
      }
    });
  }

  baseline = {
    edits,
    contrast,
    dark: pageIsDark(),
    samples: sampleEdits(edits),
  };
};

const nextFrame = (): Promise<void> =>
  new Promise(resolve => requestAnimationFrame(() => resolve()));

/**
 * Waits for the new styles to paint and any transitions they started to
 * end, since computed values read mid-transition are the old ones.
 */
const settle = async (): Promise<void> => {
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

const selectorOf = (element: Element): string =>
  element instanceof HTMLElement ? getSelector(element) : '';

/**
 * Groups elements under the selector that names them, keeping the first
 * of each group as its example.
 */
const groupBySelector = <T>(items: Array<{ element: Element; detail: T }>) => {
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

const findUnreadable = (
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

/**
 * Surfaces still in the page's old lightness once a reply turned the page
 * dark or light: the cards and panels a new theme missed.
 */
const findClashing = (dark: boolean): Array<ChatStyleProblem> => {
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

/**
 * What the value computes to on an element in the same place, so a value
 * the page overrides can be told from one the element already had.
 */
const probeValue = (
  element: Element,
  property: string,
  value: string
): string => {
  const parent = element.parentElement;

  if (!parent) {
    return '';
  }

  const probe = document.createElement('div');
  probe.style.setProperty('visibility', 'hidden');
  probe.style.setProperty(property, value);
  parent.appendChild(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
};

const findNoEffect = (samples: Array<Sample>): Array<ChatStyleProblem> =>
  samples
    .filter(({ elements, before, property, value }) => {
      const after = elements.map(element =>
        getComputedStyle(element).getPropertyValue(property)
      );

      if (after.some((computed, index) => computed !== before[index])) {
        return false;
      }

      const probed = probeValue(elements[0], property, value);
      return probed !== '' && probed !== before[0];
    })
    .slice(0, MAX_PROBLEMS)
    .map(({ selector, property, value }) => ({
      type: 'no-effect',
      selector,
      property,
      value,
    }));

/**
 * Compares the page against what startStyleCheck noted, once the edits
 * have applied: text they made hard to read, surfaces a theme change
 * missed, and declarations that changed nothing.
 */
export const checkStyle = async (): Promise<Array<ChatStyleProblem>> => {
  const noted = baseline;
  baseline = null;

  if (!noted) {
    return [];
  }

  await settle();

  const resolveBackground = backgroundResolver();
  const dark = pageIsDark();

  return [
    ...findUnreadable(noted.contrast, resolveBackground, noted.edits),
    ...(dark !== null && noted.dark !== null && dark !== noted.dark
      ? findClashing(dark)
      : []),
    ...findNoEffect(noted.samples),
  ];
};
