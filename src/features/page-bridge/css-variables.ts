export type PageCssVariable = {
  name: string;
  value: string;
  // The element that defines it, where overriding it takes effect.
  on: 'html' | 'body';
};

const MAX_VARIABLES = 150;
const MAX_VALUE_LENGTH = 80;

const COLOR_VALUE =
  /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(|\b(white|black|transparent)\b/i;
const COLOR_NAME =
  /colou?r|bg|background|foreground|fg|text|border|accent|primary|secondary|surface|link|brand|theme|palette|fill|stroke|shadow/i;

// Names of a palette's base roles, and of the components and scales a
// design system defines on top of them, which matter less.
const ROLE_NAME =
  /bg|background|canvas|surface|fg|foreground|text|border|link|accent/i;
const BASE_NAME = /default|base|primary|main|body|page|muted|subtle|emphasis/i;
const COMPONENT_NAME =
  /button|label|display|data|diff|syntax|prettylights|ansi|brand|scale|control|tooltip|progress|avatar|counter|badge|chart|shadow|animation|breakpoint|codemirror/i;
const MAX_SAMPLED = 300;
const DOMINANT = 10;
const MANY_COLORS = 40;

const customProperties = (element: Element): Map<string, string> => {
  const style = getComputedStyle(element);
  const properties = new Map<string, string>();

  for (let i = 0; i < style.length; i++) {
    const name = style[i];

    if (name.startsWith('--')) {
      properties.set(name, style.getPropertyValue(name).trim());
    }
  }

  return properties;
};

const isColor = ({ name, value }: PageCssVariable): boolean =>
  COLOR_VALUE.test(value) || COLOR_NAME.test(name);

/**
 * A color as lowercase six-digit hex when written as hex or rgb(), so
 * equal colors compare equal; otherwise as written.
 */
const normalizeColor = (value: string): string => {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);

  if (short) {
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
  }

  const rgb = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(value);

  if (rgb) {
    return `#${rgb
      .slice(1)
      .map(channel => Number(channel).toString(16).padStart(2, '0'))
      .join('')}`;
  }

  return value.toLowerCase();
};

/**
 * The colors the page shows most, from body and a sample of its elements'
 * backgrounds, text and borders.
 */
const dominantColors = (): Set<string> => {
  const counts = new Map<string, number>();
  const tally = (value: string | undefined) => {
    if (value && !/^rgba\(.*,\s*0\)$|^transparent$/.test(value)) {
      const color = normalizeColor(value);
      counts.set(color, (counts.get(color) ?? 0) + 1);
    }
  };

  const sampled: Array<Element> = [
    document.documentElement,
    ...(document.body ? [document.body] : []),
    ...Array.from(document.querySelectorAll('body *')).slice(0, MAX_SAMPLED),
  ];

  sampled.forEach(element => {
    const style = getComputedStyle(element);
    tally(style.backgroundColor);
    tally(style.color);
    tally(style.borderTopColor);
  });

  return new Set(
    Array.from(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, DOMINANT)
      .map(([color]) => color)
  );
};

/**
 * How likely a color variable is part of the page's base palette: its
 * value is a color the page shows a lot, and its name is short and names a
 * role rather than a component or a step on a scale.
 */
const paletteScore = (
  { name, value }: PageCssVariable,
  dominant: Set<string>
): number =>
  (dominant.has(normalizeColor(value)) ? 8 : 0) +
  (ROLE_NAME.test(name) ? 3 : 0) +
  (BASE_NAME.test(name) ? 2 : 0) -
  (COMPONENT_NAME.test(name) ? 4 : 0) -
  (/\d/.test(name) ? 2 : 0) -
  name.split(/[-_]/).filter(Boolean).length;

/**
 * The CSS custom properties the page sets on `html` and on `body` (where it
 * differs), colors first with the base palette leading, so a model can
 * restyle through the page's own palette even when a design system defines
 * thousands. Capped, with long values cut.
 */
export const getCssVariables = (): Array<PageCssVariable> => {
  const onHtml = customProperties(document.documentElement);
  const onBody = document.body ? customProperties(document.body) : new Map();

  const variables: Array<PageCssVariable> = [
    ...Array.from(onHtml, ([name, value]) => ({
      name,
      value,
      on: 'html' as const,
    })),
    ...Array.from(onBody)
      .filter(([name, value]) => onHtml.get(name) !== value)
      .map(([name, value]) => ({ name, value, on: 'body' as const })),
  ]
    .filter(({ value }) => value)
    .map(variable => ({
      ...variable,
      value:
        variable.value.length > MAX_VALUE_LENGTH
          ? `${variable.value.slice(0, MAX_VALUE_LENGTH)}…`
          : variable.value,
    }));

  const colors = variables.filter(isColor);
  // Sampling the page only pays off when the palette is too big to show.
  const dominant =
    colors.length > MANY_COLORS ? dominantColors() : new Set<string>();
  const ranked = colors
    .map(variable => ({ variable, score: paletteScore(variable, dominant) }))
    .sort((a, b) => b.score - a.score)
    .map(({ variable }) => variable);

  return [...ranked, ...variables.filter(variable => !isColor(variable))].slice(
    0,
    MAX_VARIABLES
  );
};
