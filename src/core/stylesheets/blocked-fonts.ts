import type {
  GetGoogleFontFile,
  GetGoogleFontFileResponse,
} from '@stylebot/types';

import {
  getGoogleFontFileUrls,
  readFontCache,
  writeFontCache,
} from './font-cache';

const GOOGLE_FONT_FILE = /^https:\/\/fonts\.gstatic\.com\//;

const DESCRIPTORS: Record<string, string> = {
  style: 'font-style',
  weight: 'font-weight',
  stretch: 'font-stretch',
  unicodeRange: 'unicode-range',
  display: 'font-display',
};

const handledUrls = new Set<string>();
let watching = false;

const unquote = (family: string): string =>
  family.trim().replace(/^(["'])(.*)\1$/, '$2');

/**
 * The @font-face rules in Stylebot's stylesheets whose src loads the url. A
 * variable font serves every weight from one file, so there can be several.
 */
const getFontFaceRules = (url: string): Array<CSSFontFaceRule> => {
  const rules: Array<CSSFontFaceRule> = [];

  document
    .querySelectorAll<HTMLStyleElement>('style[id^="stylebot-css-"]')
    .forEach(style => {
      Array.from(style.sheet?.cssRules ?? []).forEach(rule => {
        if (
          rule instanceof CSSFontFaceRule &&
          rule.style.getPropertyValue('src').includes(url)
        ) {
          rules.push(rule);
        }
      });
    });

  return rules;
};

// Index access rather than destructuring, which compiles to an ES5 helper.
const getDescriptors = (rule: CSSFontFaceRule): FontFaceDescriptors =>
  Object.fromEntries(
    Object.entries(DESCRIPTORS)
      .map(entry => [entry[0], rule.style.getPropertyValue(entry[1])])
      // An empty descriptor is a syntax error that fails the whole face.
      .filter(entry => entry[1])
  );

/**
 * Registers a font file from its base64 bytes for every rule that loads it.
 */
const addFontFaces = (rules: Array<CSSFontFaceRule>, data: string): void => {
  const bytes = Uint8Array.from(atob(data), char => char.charCodeAt(0));

  rules.forEach(rule => {
    const family = unquote(rule.style.getPropertyValue('font-family'));
    document.fonts.add(new FontFace(family, bytes, getDescriptors(rule)));
  });
};

/**
 * Registers a blocked font file from its bytes, fetched by the background,
 * since a FontFace built from data makes no request for the page CSP to block.
 * The bytes are cached so the next load can register the font before paint.
 */
const loadBlockedFont = (url: string): void => {
  const rules = getFontFaceRules(url);

  if (rules.length === 0) {
    return;
  }

  const message: GetGoogleFontFile = { name: 'GetGoogleFontFile', url };

  // Promise chain rather than async, which would pull the ES5 async helpers
  // into every content script.
  chrome.runtime
    .sendMessage<GetGoogleFontFile, GetGoogleFontFileResponse>(message)
    .catch(() => '')
    .then(data => {
      if (!data) {
        handledUrls.delete(url);
        return;
      }

      writeFontCache(url, data);
      addFontFaces(rules, data);
    });
};

/**
 * Registers the font files in the css that the page's CSP blocked on an
 * earlier load from their cached bytes, so the first paint has them instead
 * of waiting on the blocked request and a round trip to the background.
 */
export const loadCachedFonts = (css: string): void => {
  getGoogleFontFileUrls(css).forEach(url => {
    const data = handledUrls.has(url) ? null : readFontCache(url);
    const rules = data ? getFontFaceRules(url) : [];

    if (data && rules.length > 0) {
      handledUrls.add(url);
      addFontFaces(rules, data);
    }
  });
};

/**
 * Loads Google Fonts files the page's CSP blocks (e.g. `default-src 'self'`
 * on Hacker News) another way. Only blocked files are handled, so a page
 * still fetches just the unicode-range subsets it renders.
 */
export const watchBlockedFonts = (): void => {
  if (watching) {
    return;
  }

  watching = true;

  document.addEventListener('securitypolicyviolation', event => {
    const url = event.blockedURI;

    if (
      !event.isTrusted ||
      event.disposition !== 'enforce' ||
      event.effectiveDirective !== 'font-src' ||
      !GOOGLE_FONT_FILE.test(url) ||
      handledUrls.has(url)
    ) {
      return;
    }

    handledUrls.add(url);
    loadBlockedFont(url);
  });
};
