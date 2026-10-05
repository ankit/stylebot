import {
  getGoogleFontFileUrls,
  pruneFontCache,
  readFontCache,
  writeFontCache,
} from './font-cache';

describe('font-cache', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('reads back a written font file', () => {
    writeFontCache('https://fonts.gstatic.com/s/lobster/a.woff2', 'd09GMg==');

    expect(readFontCache('https://fonts.gstatic.com/s/lobster/a.woff2')).toBe(
      'd09GMg=='
    );
    expect(readFontCache('https://fonts.gstatic.com/s/lobster/b.woff2')).toBe(
      null
    );
  });

  it('finds the Google Fonts files the css loads', () => {
    const css = `
      @font-face { src: url(https://fonts.gstatic.com/s/lobster/a.woff2) format('woff2'); }
      @font-face { src: url("https://fonts.gstatic.com/s/lobster/b.woff2"); }
      @font-face { src: url(https://example.com/c.woff2); }
    `;

    expect(getGoogleFontFileUrls(css)).toEqual([
      'https://fonts.gstatic.com/s/lobster/a.woff2',
      'https://fonts.gstatic.com/s/lobster/b.woff2',
    ]);
  });

  it('prunes font files no live css loads, leaving other keys alone', () => {
    writeFontCache('https://fonts.gstatic.com/s/lobster/a.woff2', 'a');
    writeFontCache('https://fonts.gstatic.com/s/removed/b.woff2', 'b');
    localStorage.setItem('some-other-key', 'value');

    pruneFontCache([
      '@font-face { src: url(https://fonts.gstatic.com/s/lobster/a.woff2); }',
    ]);

    expect(readFontCache('https://fonts.gstatic.com/s/lobster/a.woff2')).toBe(
      'a'
    );
    expect(
      readFontCache('https://fonts.gstatic.com/s/removed/b.woff2')
    ).toBeNull();
    expect(localStorage.getItem('some-other-key')).toBe('value');
  });
});
