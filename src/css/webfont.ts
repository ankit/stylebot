import { parse } from 'postcss';

import {
  GetGoogleWebFontExists,
  GetGoogleWebFontExistsResponse,
} from '@stylebot/types';

/**
 * Checked from the background page because a content script's fetch runs in
 * the page's context, where Firefox enforces the page's CSP on it (see #754).
 */
const googleWebFontExists = async (url: string): Promise<boolean> => {
  const message: GetGoogleWebFontExists = {
    name: 'GetGoogleWebFontExists',
    url,
  };

  const response = await chrome.runtime
    .sendMessage<GetGoogleWebFontExists, GetGoogleWebFontExistsResponse>(
      message
    )
    .catch(() => false);

  return !!response;
};

const getGoogleFontUrlAndParams = (
  value: string
): { url: string; params: string } => {
  const arg = value.replace(' ', '+');
  const url = `https://fonts.googleapis.com/css2?family=${arg}:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap`;
  const params = `url(${url})`;

  return { url, params };
};

/**
 * If font exists in https://developers.google.com/fonts, add relevant @import to the css.
 * Guards against duplicate @import and invalid fonts.
 */
export const addGoogleWebFont = async (
  value: string,
  css: string
): Promise<string> => {
  const root = parse(css);
  const { url, params } = getGoogleFontUrlAndParams(value);

  if (!(await googleWebFontExists(url))) {
    return css;
  }

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
 * Remove unused google web fonts from given css.
 */
export const cleanGoogleWebFonts = (css: string): string => {
  const root = parse(css);
  const fonts: Array<string> = [];

  root.walkDecls('font-family', decl => {
    const declFonts = decl.value.split(',');

    declFonts.forEach(value => {
      const trimmedValue = value.trim();

      if (trimmedValue && fonts.indexOf(trimmedValue) === -1) {
        fonts.push(trimmedValue);
      }
    });
  });

  const fontParams = fonts.map(font => getGoogleFontUrlAndParams(font).params);

  root.walkAtRules('import', atRule => {
    if (fontParams.indexOf(atRule.params) === -1) {
      atRule.remove();
    }
  });

  return root.toString();
};
