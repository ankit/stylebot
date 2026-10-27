import type { CachedState, CachedStyle } from '@stylebot/stylesheets';
import { COMPILED_STYLES_VERSION } from '@stylebot/saved-styles';
import type { CompiledStyle, CompiledStyles } from '@stylebot/types';

jest.mock('@stylebot/stylesheets', () => ({
  ...jest.requireActual('@stylebot/stylesheets'),
  injectStylesheet: jest.fn(),
  removeStylesheet: jest.fn(),
}));
jest.mock('@stylebot/readability');

const style = (
  url: string,
  css: string,
  enabled: boolean,
  importUrls: Array<string> = []
): CachedStyle => ({ url, css, importUrls, enabled });

describe('applyPageState', () => {
  let stylesheet: typeof import('@stylebot/stylesheets');
  let readability: typeof import('@stylebot/readability');
  let applyPageState: typeof import('./page-state').applyPageState;

  beforeEach(() => {
    jest.resetModules();

    stylesheet = require('@stylebot/stylesheets');
    readability = require('@stylebot/readability');
    ({ applyPageState } = require('./page-state'));
  });

  it('injects only the enabled styles', () => {
    const state: CachedState = {
      styles: [style('a', '.a{}', true), style('b', '.b{}', false)],
      readability: false,
    };

    applyPageState(state);

    expect(stylesheet.injectStylesheet).toHaveBeenCalledTimes(1);
    expect(stylesheet.injectStylesheet).toHaveBeenCalledWith('a', '.a{}', []);
  });

  it('passes the compiled css and its @import urls through unchanged', () => {
    applyPageState({
      styles: [
        style('a', '.a{color:red !important}', true, ['https://x.test/a.css']),
      ],
      readability: false,
    });

    expect(stylesheet.injectStylesheet).toHaveBeenCalledWith(
      'a',
      '.a{color:red !important}',
      ['https://x.test/a.css']
    );
  });

  it('applies readability when the state calls for it', () => {
    applyPageState({ styles: [], readability: true });

    expect(readability.applyReadability).toHaveBeenCalledTimes(1);
    expect(readability.removeReadability).not.toHaveBeenCalled();
  });

  it('removes readability when the state does not call for it', () => {
    applyPageState({ styles: [], readability: false });

    expect(readability.removeReadability).toHaveBeenCalledTimes(1);
    expect(readability.applyReadability).not.toHaveBeenCalled();
  });

  const applied = { styles: [style('a', '.a{}', true)], readability: false };

  it('removes a stylesheet the previous state had enabled that is now gone', () => {
    applyPageState({ styles: [], readability: false }, applied);

    expect(stylesheet.removeStylesheet).toHaveBeenCalledWith('a');
  });

  it('removes a stylesheet the previous state had enabled that is now disabled', () => {
    applyPageState(
      { styles: [style('a', '.a{}', false)], readability: false },
      applied
    );

    expect(stylesheet.removeStylesheet).toHaveBeenCalledWith('a');
  });

  it('removes a disabled stylesheet the previous state did not record', () => {
    applyPageState({ styles: [style('a', '.a{}', false)], readability: false });

    expect(stylesheet.removeStylesheet).toHaveBeenCalledWith('a');
  });

  it('removes nothing without a previous state', () => {
    applyPageState({ styles: [], readability: false });

    expect(stylesheet.removeStylesheet).not.toHaveBeenCalled();
  });

  it('does not remove a stylesheet that remains enabled', () => {
    applyPageState(
      { styles: [style('a', '.a{updated}', true)], readability: false },
      applied
    );

    expect(stylesheet.removeStylesheet).not.toHaveBeenCalled();
    expect(stylesheet.injectStylesheet).toHaveBeenLastCalledWith(
      'a',
      '.a{updated}',
      []
    );
  });

  it('sets the color scheme along with the css, and removes it once gone', () => {
    applyPageState({ ...applied, scheme: 'dark' });

    expect(document.documentElement.dataset.stylebotScheme).toBe('dark');

    applyPageState(applied, applied);

    expect(document.documentElement.hasAttribute('data-stylebot-scheme')).toBe(
      false
    );
  });
});

describe('getPageState', () => {
  let getPageState: typeof import('./page-state').getPageState;

  const compiled = (style: Partial<CompiledStyle>): CompiledStyles => ({
    version: COMPILED_STYLES_VERSION,
    revision: 'rev',
    styles: {
      localhost: {
        css: 'a{}',
        importUrls: [],
        enabled: true,
        readability: false,
        ...style,
      },
    },
  });

  beforeEach(() => {
    jest.resetModules();
    ({ getPageState } = require('./page-state'));
  });

  it("takes the default style's color scheme", () => {
    expect(getPageState(compiled({ scheme: 'light' })).scheme).toBe('light');
  });

  it('has no color scheme when the default style is off', () => {
    const state = getPageState(compiled({ scheme: 'light', enabled: false }));

    expect(state).not.toHaveProperty('scheme');
  });

  it('has no color scheme when the default style declares none', () => {
    expect(getPageState(compiled({}))).not.toHaveProperty('scheme');
  });
});
