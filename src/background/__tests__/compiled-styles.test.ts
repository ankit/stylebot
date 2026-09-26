import type { StyleMap } from '@stylebot/types';

jest.mock('@stylebot/css', () => {
  const actual = jest.requireActual('@stylebot/css');
  return { ...actual, compileStyle: jest.fn(actual.compileStyle) };
});

const style = (css: string, extra: Partial<StyleMap[string]> = {}) => ({
  css,
  enabled: true,
  readability: false,
  modifiedTime: '2026-09-25T00:00:00.000Z',
  ...extra,
});

describe('compileStyles', () => {
  let compileStyles: typeof import('../compiled-styles').compileStyles;
  let css: typeof import('@stylebot/css');

  beforeEach(() => {
    jest.resetModules();
    css = require('@stylebot/css');
    ({ compileStyles } = require('../compiled-styles'));
  });

  it('forces !important and splits out @import urls, stamped with the revision', () => {
    const compiled = compileStyles(
      {
        'a.com': style(
          '@import url("https://x.test/a.css");\na { color: red; }'
        ),
      },
      'rev-1'
    );

    expect(compiled.revision).toBe('rev-1');
    expect(compiled.styles['a.com']).toEqual({
      css: 'a { color: red !important; }',
      importUrls: ['https://x.test/a.css'],
      enabled: true,
      readability: false,
    });
  });

  it('leaves a style that turned Override site styles off as written', () => {
    const compiled = compileStyles(
      { 'a.com': style('a { color: red; }', { forceImportant: false }) },
      'rev-1'
    );

    expect(compiled.styles['a.com'].css).toBe('a { color: red; }');
  });

  it("carries each style's enabled and readability flags", () => {
    const compiled = compileStyles(
      { 'a.com': style('', { enabled: false, readability: true }) },
      'rev-1'
    );

    expect(compiled.styles['a.com']).toMatchObject({
      enabled: false,
      readability: true,
    });
  });

  it('compiles a style it cannot parse to nothing', () => {
    const compiled = compileStyles({ 'a.com': style('a {') }, 'rev-1');

    expect(compiled.styles['a.com']).toMatchObject({ css: '', importUrls: [] });
  });

  it('reuses the previous compiled entry of a style whose css and !important setting are unchanged', () => {
    const styles: StyleMap = {
      'a.com': style('a { color: red; }'),
      'b.com': style('b { color: blue; }'),
    };
    const previous = compileStyles(styles, 'rev-1');
    (css.compileStyle as jest.Mock).mockClear();

    const next = compileStyles(
      {
        'a.com': style('a { color: red; }', { enabled: false }),
        'b.com': style('b { color: green; }'),
      },
      'rev-2',
      { styles, compiled: previous.styles }
    );

    expect(css.compileStyle).toHaveBeenCalledTimes(1);
    expect(css.compileStyle).toHaveBeenCalledWith('b { color: green; }', {
      forceImportant: true,
    });
    expect(next.styles['a.com']).toEqual({
      ...previous.styles['a.com'],
      enabled: false,
    });
  });

  it('recompiles a style whose !important setting changed', () => {
    const styles: StyleMap = { 'a.com': style('a { color: red; }') };
    const previous = compileStyles(styles, 'rev-1');

    const next = compileStyles(
      { 'a.com': style('a { color: red; }', { forceImportant: false }) },
      'rev-2',
      { styles, compiled: previous.styles }
    );

    expect(next.styles['a.com'].css).toBe('a { color: red; }');
  });
});
