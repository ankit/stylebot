import { parse } from 'postcss';

import { getPrimaryFontFamily } from './font-family';

import {
  GetGoogleWebFontExists,
  GetGoogleWebFontExistsResponse,
} from '@stylebot/types';

// Generic and global font-family keywords, which are never Google Fonts.
const CSS_FAMILY_KEYWORDS = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'math',
  'emoji',
  'fangsong',
  'inherit',
  'initial',
  'unset',
  'revert',
]);

const getGoogleFontUrlAndParams = (
  value: string
): { url: string; params: string } => {
  const arg = value.replace(/ /g, '+');
  const url = `https://fonts.googleapis.com/css2?family=${arg}:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap`;
  const params = `url(${url})`;

  return { url, params };
};

/**
 * Adds the Google Fonts import for a family to the top of the css without
 * checking that the family exists. Guards against a duplicate import.
 */
export const addGoogleWebFontImport = (family: string, css: string): string => {
  const root = parse(css);
  const { params } = getGoogleFontUrlAndParams(family);

  let importExists = false;
  root.walkAtRules('import', atRule => {
    if (atRule.params === params) {
      importExists = true;
    }
  });

  if (!importExists) {
    const rule = parse(`@import ${params};`);
    root.prepend(rule);

    const next = root.first?.next();
    if (next) {
      next.raws.before = '\n\n';
    }
  }

  return root.toString();
};

/**
 * Whether a family is served by https://fonts.google.com. Checked from the
 * background page because a content script's fetch runs in the page's
 * context, where Firefox enforces the page's CSP on it (see #754).
 */
export const googleWebFontExists = async (family: string): Promise<boolean> => {
  if (CSS_FAMILY_KEYWORDS.has(family.toLowerCase())) {
    return false;
  }

  const message: GetGoogleWebFontExists = {
    name: 'GetGoogleWebFontExists',
    url: getGoogleFontUrlAndParams(family).url,
  };

  const response = await chrome.runtime
    .sendMessage<GetGoogleWebFontExists, GetGoogleWebFontExistsResponse>(
      message
    )
    .catch(() => false);

  return !!response;
};

/**
 * If the family exists on https://fonts.google.com, add its import to the css.
 */
export const addGoogleWebFont = async (
  family: string,
  css: string
): Promise<string> =>
  (await googleWebFontExists(family))
    ? addGoogleWebFontImport(family, css)
    : css;

/**
 * Remove google web font imports that no declaration uses as its first
 * family; fallbacks further down a stack are never loaded.
 */
export const cleanGoogleWebFonts = (css: string): string => {
  const root = parse(css);
  const fonts: Array<string> = [];

  root.walkDecls('font-family', decl => {
    const family = getPrimaryFontFamily(decl.value);

    if (family && fonts.indexOf(family) === -1) {
      fonts.push(family);
    }
  });

  const fontParams = fonts.map(font => getGoogleFontUrlAndParams(font).params);

  root.walkAtRules('import', atRule => {
    if (fontParams.indexOf(atRule.params) === -1) {
      atRule.remove();
    }
  });

  return root.toString();
};
