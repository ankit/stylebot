import type { PageStyleOptions, StyleColorScheme } from '@stylebot/types';

import { injectStylesheet, removeStylesheet } from './stylesheet';

const ATTRIBUTE_PREFIX = 'data-stylebot-';
const VARIABLES_ID = ':options';

export const SCHEME_ATTRIBUTE = `${ATTRIBUTE_PREFIX}scheme`;

// <html> carries other data-stylebot-* attributes, so only ours are removed.
let attributes = new Set<string>();

const getOptionAttribute = (name: string): string =>
  `${ATTRIBUTE_PREFIX}${name.toLowerCase()}`;

/**
 * Sets each option a style declares on <html> as `data-stylebot-<name>`, and
 * as `--<name>` on :root as UserCSS does, removing those no longer declared.
 */
export const setStyleOptions = (options: PageStyleOptions = {}): void => {
  const root = document.documentElement;
  const entries = Object.entries(options);
  const next = new Set(entries.map(([name]) => getOptionAttribute(name)));

  attributes.forEach(attribute => {
    if (!next.has(attribute)) {
      root.removeAttribute(attribute);
    }
  });

  entries.forEach(([name, { value }]) => {
    root.setAttribute(getOptionAttribute(name), value);
  });

  attributes = next;

  if (entries.length === 0) {
    removeStylesheet(VARIABLES_ID);
    return;
  }

  const declarations = entries.map(([name, { css }]) => `--${name}: ${css};`);

  // Doubled to outrank a fallback the style's own :root rule declares.
  injectStylesheet(
    VARIABLES_ID,
    `:root:root { ${declarations.join(' ')} }`,
    []
  );
};

/**
 * Sets the color scheme a style asked for, or removes it with any other
 * option when no style asks for one.
 */
export const setSchemeAttribute = (scheme?: StyleColorScheme): void =>
  setStyleOptions(scheme && { scheme: { value: scheme, css: scheme } });
