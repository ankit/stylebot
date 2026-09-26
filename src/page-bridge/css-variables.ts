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
 * The CSS custom properties the page sets on `html` and on `body` (where it
 * differs), colors first, so a model can restyle through the page's own
 * palette. Capped, with long values cut.
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

  return [
    ...variables.filter(isColor),
    ...variables.filter(variable => !isColor(variable)),
  ].slice(0, MAX_VARIABLES);
};
