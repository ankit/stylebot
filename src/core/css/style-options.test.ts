const dedent = require('dedent');

import {
  getColorScheme,
  getPageStyleOptions,
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

describe('parseStyleOptions with @var', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('reads a select of value:Label entries, with a starred default', () => {
    const css = dedent`
      /* ==UserStyle==
      @name Catppuccin
      @var select accentColor "Accent" ["rosewater:Rosewater", "mauve:Mauve*", "blue:Blue"]
      ==/UserStyle== */
    `;

    expect(parseStyleOptions(css)).toEqual({
      accentColor: {
        type: 'select',
        label: 'Accent',
        values: ['rosewater', 'mauve', 'blue'],
        default: 'mauve',
        choices: {
          rosewater: { label: 'Rosewater', css: 'rosewater' },
          mauve: { label: 'Mauve', css: 'mauve' },
          blue: { label: 'Blue', css: 'blue' },
        },
      },
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('defaults a select to its first value without a star', () => {
    const css = dedent`
      /* ==Stylebot==
      @var select font Font ["Arial", "Times New Roman"]
      ==/Stylebot== */
    `;

    expect(parseStyleOptions(css).font).toMatchObject({
      label: 'Font',
      values: ['Arial', 'Times New Roman'],
      default: 'Arial',
    });
  });

  it('reads the object form, whose values are the css', () => {
    const css = dedent`
      /* ==UserStyle==
      @var select bg "Background" {
        "near_black:Near Black": "#222",
        "near_white:Near White*": "#ddd"
      }
      ==/UserStyle== */
    `;

    expect(parseStyleOptions(css).bg).toEqual({
      type: 'select',
      label: 'Background',
      values: ['near_black', 'near_white'],
      default: 'near_white',
      choices: {
        near_black: { label: 'Near Black', css: '#222' },
        near_white: { label: 'Near White', css: '#ddd' },
      },
    });
  });

  it('reads a checkbox', () => {
    const css = dedent`
      /* ==Stylebot==
      @var checkbox rounded 'Rounded corners' 1
      ==/Stylebot== */
    `;

    expect(parseStyleOptions(css)).toEqual({
      rounded: {
        type: 'checkbox',
        label: 'Rounded corners',
        values: ['0', '1'],
        default: '1',
      },
    });
  });

  it('reads @option and @var together, from both blocks', () => {
    const css = dedent`
      /* ==Stylebot==
      @option scheme select [system, light, dark] system
      ==/Stylebot== */
      /* ==UserStyle==
      @var checkbox rounded "Rounded" 0
      ==/UserStyle== */
    `;

    expect(Object.keys(parseStyleOptions(css))).toEqual(['scheme', 'rounded']);
  });

  it.each([
    ['an unsupported type', '@var color accent "Accent" #f00'],
    ['a checkbox default other than 0 or 1', '@var checkbox on "On" yes'],
    ['a select that is not json', '@var select a "A" [red, blue]'],
    ['an empty select', '@var select a "A" []'],
    ['a select with a repeated value', '@var select a "A" ["x", "x:X"]'],
    ['a line missing its default', '@var checkbox on "On"'],
    ['scheme', '@var select scheme "Mode" ["light", "dark"]'],
  ])('ignores %s', (_, line) => {
    const css = `/* ==Stylebot==\n${line}\n==/Stylebot== */`;

    expect(parseStyleOptions(css)).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('getPageStyleOptions', () => {
  const css = dedent`
    /* ==Stylebot==
    @option scheme select [system, light, dark] system
    @var select bg "Background" {"black:Black": "#000", "white:White": "#fff"}
    @var checkbox rounded "Rounded" 1
    ==/Stylebot== */
  `;

  it('is undefined for a style without options', () => {
    expect(getPageStyleOptions('a { color: red; }')).toBeUndefined();
  });

  it("gives each option's value, and its css for a select's choice", () => {
    expect(getPageStyleOptions(css, { bg: 'white', rounded: '0' })).toEqual({
      scheme: { value: 'system', css: 'system' },
      bg: { value: 'white', css: '#fff' },
      rounded: { value: '0', css: '0' },
    });
  });

  it('falls back to the defaults', () => {
    expect(getPageStyleOptions(css, { bg: 'red' })).toMatchObject({
      bg: { value: 'black', css: '#000' },
      rounded: { value: '1', css: '1' },
    });
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
