import { parse } from 'postcss';

import { getPrimaryFontFamily } from './font-family';

import type {
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

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

// css2 skips listed weights a family lacks, so one list loads every weight of
// any family; a variable font's weights all share its one file.
const AXES = `ital,wght@${[0, 1]
  .flatMap(ital => WEIGHTS.map(weight => `${ital},${weight}`))
  .join(';')}`;

const IMPORT_FAMILY =
  /^url\(["']?https:\/\/fonts\.googleapis\.com\/css2\?family=([^:&"')]+)/;

const getGoogleFontUrlAndParams = (
  value: string
): { url: string; params: string } => {
  const arg = value.replace(/ /g, '+');
  const url = `https://fonts.googleapis.com/css2?family=${arg}:${AXES}&display=swap`;
  const params = `url(${url})`;

  return { url, params };
};

/**
 * The family a Google Fonts @import loads, whatever weights it asks for, or
 * null for any other @import.
 */
const getImportFamily = (params: string): string | null => {
  const match = IMPORT_FAMILY.exec(params);
  return match ? match[1].replace(/\+/g, ' ') : null;
};

/**
 * Adds the Google Fonts import for a family to the top of the css without
 * checking that the family exists. Guards against a duplicate import, and
 * replaces one of the same family that asks for other weights.
 */
export const addGoogleWebFontImport = (family: string, css: string): string => {
  const root = parse(css);
  const { params } = getGoogleFontUrlAndParams(family);

  let importExists = false;
  root.walkAtRules('import', atRule => {
    if (atRule.params === params) {
      importExists = true;
    } else if (getImportFamily(atRule.params) === family) {
      atRule.remove();
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
  const fonts = new Set<string>();

  root.walkDecls('font-family', decl => {
    const family = getPrimaryFontFamily(decl.value);

    if (family) {
      fonts.add(family);
    }
  });

  root.walkAtRules('import', atRule => {
    const family = getImportFamily(atRule.params);

    if (!family || !fonts.has(family)) {
      atRule.remove();
    }
  });

  return root.toString();
};
