import type { CachedState, CachedStyle } from '../cache';

jest.mock('../stylesheet');
jest.mock('@stylebot/readability');

const style = (
  url: string,
  css: string,
  enabled: boolean,
  importUrls: Array<string> = []
): CachedStyle => ({ url, css, importUrls, enabled });

describe('applyPageState', () => {
  let stylesheet: typeof import('../stylesheet');
  let readability: typeof import('@stylebot/readability');
  let applyPageState: typeof import('../page-state').applyPageState;

  beforeEach(() => {
    jest.resetModules();

    stylesheet = require('../stylesheet');
    readability = require('@stylebot/readability');
    ({ applyPageState } = require('../page-state'));
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
});
