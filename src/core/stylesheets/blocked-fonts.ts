import type {
  GetGoogleFontFile,
  GetGoogleFontFileResponse,
} from '@stylebot/types';

const GOOGLE_FONT_FILE = /^https:\/\/fonts\.gstatic\.com\//;

const DESCRIPTORS: Array<[keyof FontFaceDescriptors, string]> = [
  ['style', 'font-style'],
  ['weight', 'font-weight'],
  ['stretch', 'font-stretch'],
  ['unicodeRange', 'unicode-range'],
  ['display', 'font-display'],
];

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

const getDescriptors = (rule: CSSFontFaceRule): FontFaceDescriptors =>
  Object.fromEntries(
    DESCRIPTORS.map(([key, property]) => [
      key,
      rule.style.getPropertyValue(property),
    ])
      // An empty descriptor is a syntax error that fails the whole face.
      .filter(([, value]) => value)
  );

/**
 * Registers a blocked font file from its bytes, fetched by the background,
 * since a FontFace built from data makes no request for the page CSP to block.
 */
const loadBlockedFont = async (url: string): Promise<void> => {
  const rules = getFontFaceRules(url);

  if (rules.length === 0) {
    return;
  }

  const message: GetGoogleFontFile = { name: 'GetGoogleFontFile', url };
  const data = await chrome.runtime
    .sendMessage<GetGoogleFontFile, GetGoogleFontFileResponse>(message)
    .catch(() => '');

  if (!data) {
    handledUrls.delete(url);
    return;
  }

  const bytes = Uint8Array.from(atob(data), char => char.charCodeAt(0));

  rules.forEach(rule => {
    const family = unquote(rule.style.getPropertyValue('font-family'));
    document.fonts.add(new FontFace(family, bytes, getDescriptors(rule)));
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
