/* eslint-disable @typescript-eslint/no-explicit-any */

import { loadCachedFonts, watchBlockedFonts } from './blocked-fonts';
import { readFontCache, writeFontCache } from './font-cache';

const FONT_URL = 'https://fonts.gstatic.com/s/lobster/a.woff2';

const FONT_CSS = `@font-face {
  font-family: 'Lobster';
  font-weight: 400;
  src: url(${FONT_URL}) format('woff2');
}`;

const added: Array<{ family: string; descriptors: FontFaceDescriptors }> = [];

class FakeFontFace {
  constructor(family: string, _source: unknown, descriptors: any) {
    added.push({ family, descriptors });
  }
}

const injectFontCss = (): void => {
  const style = document.createElement('style');

  style.id = 'stylebot-css-example.com';
  style.textContent = FONT_CSS;
  document.documentElement.appendChild(style);
};

/**
 * Starts watching and reports a font-src violation for the url. Calls the
 * listener directly, since jsdom won't dispatch a trusted event.
 */
const reportViolation = (blockedURI: string): void => {
  const addEventListener = jest.spyOn(document, 'addEventListener');

  watchBlockedFonts();

  const listener = addEventListener.mock.calls[0][1] as (event: any) => void;
  addEventListener.mockRestore();

  listener({
    isTrusted: true,
    blockedURI,
    disposition: 'enforce',
    effectiveDirective: 'font-src',
  });
};

const flush = () => new Promise(resolve => setTimeout(resolve));

describe('blocked-fonts', () => {
  let sendMessage: jest.Mock;

  beforeAll(() => {
    const probe = document.createElement('style');
    probe.textContent = FONT_CSS;
    document.head.appendChild(probe);

    // jsdom parses @font-face but exposes none of the font loading globals.
    Object.assign(global, {
      CSSFontFaceRule: probe.sheet?.cssRules[0].constructor,
      FontFace: FakeFontFace,
    });
    Object.defineProperty(document, 'fonts', {
      value: { add: () => undefined },
    });

    probe.remove();
  });

  beforeEach(() => {
    sendMessage = jest.fn(() => Promise.resolve(btoa('wOF2')));
    global.chrome = {
      runtime: { sendMessage },
    } as unknown as typeof chrome;
  });

  afterEach(() => {
    added.length = 0;
    localStorage.clear();
    document.getElementById('stylebot-css-example.com')?.remove();
  });

  it('registers a cached font file before the page CSP blocks it', () => {
    writeFontCache(FONT_URL, btoa('wOF2'));
    injectFontCss();

    loadCachedFonts(FONT_CSS);

    expect(added).toEqual([
      { family: 'Lobster', descriptors: { weight: '400' } },
    ]);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('registers nothing for a font file that was never blocked', () => {
    injectFontCss();

    loadCachedFonts(FONT_CSS.replace('lobster/a', 'lobster/uncached'));

    expect(added).toEqual([]);
  });

  it('caches a blocked font file it fetched through the background', async () => {
    const url = 'https://fonts.gstatic.com/s/lobster/fetched.woff2';

    injectFontCss();
    document.getElementById('stylebot-css-example.com')!.textContent =
      FONT_CSS.replace(FONT_URL, url);

    reportViolation(url);
    await flush();

    expect(sendMessage).toHaveBeenCalledWith({
      name: 'GetGoogleFontFile',
      url,
    });
    expect(readFontCache(url)).toBe(btoa('wOF2'));
    expect(added).toHaveLength(1);
  });
});
