const dedent = require('dedent');

import {
  getColorScheme,
  getStyleOptionValue,
  parseStyleOptions,
} from './style-options';

describe('parseStyleOptions', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('returns nothing for css without a block', () => {
    expect(parseStyleOptions('a { color: red; }')).toEqual({});
    expect(warn).not.toHaveBeenCalled();
  });

  it('reads the scheme option', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @option scheme select [system, light, dark] system
       * ==/Stylebot==
       */
      a { color: red; }
    `;

    expect(parseStyleOptions(css)).toEqual({
      scheme: {
        type: 'select',
        values: ['system', 'light', 'dark'],
        default: 'system',
      },
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps a custom default', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @option scheme select [system,light,dark] dark
       * ==/Stylebot==
       */
    `;

    expect(parseStyleOptions(css).scheme?.default).toBe('dark');
  });

  it('reads a plain comment', () => {
    const css = dedent`
      /* ==Stylebot==
      @option scheme select [system, light, dark] dark
      ==/Stylebot== */
    `;

    expect(parseStyleOptions(css).scheme?.default).toBe('dark');
    expect(warn).not.toHaveBeenCalled();
  });

  it('reads a JSDoc comment that opens on the marker line', () => {
    const css = dedent`
      /** ==Stylebot==
       * @option scheme select [system, light, dark] dark
       * ==/Stylebot== */
    `;

    expect(parseStyleOptions(css).scheme?.default).toBe('dark');
  });

  it('finds a block that is not at the top', () => {
    const css = dedent`
      a { color: red; }

      /**
       * ==Stylebot==
       * @option scheme select [system, light, dark] system
       * ==/Stylebot==
       */
      b { color: blue; }
    `;

    expect(Object.keys(parseStyleOptions(css))).toEqual(['scheme']);
  });

  it('ignores an unknown option and keeps the others', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @option accent select [red, blue] red
       * @option scheme select [system, light, dark] system
       * ==/Stylebot==
       */
    `;

    expect(Object.keys(parseStyleOptions(css))).toEqual(['scheme']);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('ignores a line with a label', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @option scheme "Theme" select [system, light, dark] system
       * ==/Stylebot==
       */
    `;

    expect(parseStyleOptions(css)).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('ignores a line without a default', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @option scheme select [system, light, dark]
       * ==/Stylebot==
       */
    `;

    expect(parseStyleOptions(css)).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('ignores a line whose default is not one of its values', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @option scheme select [system, light, dark] sepia
       * ==/Stylebot==
       */
    `;

    expect(parseStyleOptions(css)).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('ignores a line with other values', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @option scheme select [system, light, sepia] system
       * ==/Stylebot==
       */
    `;

    expect(parseStyleOptions(css)).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('ignores a line missing a value', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @option scheme select [light, dark] light
       * ==/Stylebot==
       */
    `;

    expect(parseStyleOptions(css)).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('ignores a line with another type', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @option scheme toggle [system, light, dark] system
       * ==/Stylebot==
       */
    `;

    expect(parseStyleOptions(css)).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('ignores a line without brackets around its values', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @option scheme select system, light, dark system
       * ==/Stylebot==
       */
    `;

    expect(parseStyleOptions(css)).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('ignores an option with nothing after it', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @option scheme
       * ==/Stylebot==
       */
    `;

    expect(parseStyleOptions(css)).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('ignores a line that is not a key', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * scheme: dark
       * ==/Stylebot==
       */
    `;

    expect(parseStyleOptions(css)).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('skips other metadata keys without a warning', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @name Classifieds
       * @author Someone
       * @option scheme select [system, light, dark] system
       * ==/Stylebot==
       */
    `;

    expect(Object.keys(parseStyleOptions(css))).toEqual(['scheme']);
    expect(warn).not.toHaveBeenCalled();
  });

  it('skips @modes without a warning', () => {
    const css = dedent`
      /* ==Stylebot==
      @modes light, dark
      ==/Stylebot== */
    `;

    expect(parseStyleOptions(css)).toEqual({});
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps the first of two declarations', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @option scheme select [system, light, dark] system
       * @option scheme select [system, light, dark] dark
       * ==/Stylebot==
       */
    `;

    expect(parseStyleOptions(css).scheme?.default).toBe('system');
  });

  it('ignores a block that is never closed', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @option scheme select [system, light, dark] system
       */
    `;

    expect(parseStyleOptions(css)).toEqual({});
  });
});

describe('getStyleOptionValue', () => {
  const declaration = {
    type: 'select' as const,
    values: ['system', 'light', 'dark'],
    default: 'system',
  };

  it('uses the stored value', () => {
    expect(getStyleOptionValue(declaration, 'dark')).toBe('dark');
  });

  it('falls back to the default without a valid stored value', () => {
    expect(getStyleOptionValue(declaration)).toBe('system');
    expect(getStyleOptionValue(declaration, 'sepia')).toBe('system');
  });
});

describe('getColorScheme', () => {
  it('is undefined for a style without the option', () => {
    expect(getColorScheme('a { color: red; }', { scheme: 'dark' })).toBe(
      undefined
    );
  });

  it('is the stored value, else the default', () => {
    const css = dedent`
      /**
       * ==Stylebot==
       * @option scheme select [system, light, dark] system
       * ==/Stylebot==
       */
    `;

    expect(getColorScheme(css, { scheme: 'light' })).toBe('light');
    expect(getColorScheme(css)).toBe('system');
  });
});
