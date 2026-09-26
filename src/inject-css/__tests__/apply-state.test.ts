import type { CachedState, CachedStyle } from '../cache';

jest.mock('../stylesheet');
jest.mock('@stylebot/readability');

const style = (
  url: string,
  css: string,
  enabled: boolean,
  importUrls: Array<string> = []
): CachedStyle => ({ url, css, importUrls, enabled });

describe('applyState', () => {
  let stylesheet: typeof import('../stylesheet');
  let readability: typeof import('@stylebot/readability');
  let applyState: typeof import('../apply-state').applyState;

  beforeEach(() => {
    // appliedUrls is module-level state, tracking what's currently
    // injected across calls — reset the module so each test starts clean.
    jest.resetModules();

    stylesheet = require('../stylesheet');
    readability = require('@stylebot/readability');
    ({ applyState } = require('../apply-state'));
  });

  it('injects only the enabled styles', () => {
    const state: CachedState = {
      styles: [style('a', '.a{}', true), style('b', '.b{}', false)],
      readability: false,
    };

    applyState(state);

    expect(stylesheet.injectStylesheet).toHaveBeenCalledTimes(1);
    expect(stylesheet.injectStylesheet).toHaveBeenCalledWith('a', '.a{}', []);
  });

  it('passes the compiled css and its @import urls through unchanged', () => {
    applyState({
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
    applyState({ styles: [], readability: true });

    expect(readability.applyReadability).toHaveBeenCalledTimes(1);
    expect(readability.removeReadability).not.toHaveBeenCalled();
  });

  it('removes readability when the state does not call for it', () => {
    applyState({ styles: [], readability: false });

    expect(readability.removeReadability).toHaveBeenCalledTimes(1);
    expect(readability.applyReadability).not.toHaveBeenCalled();
  });

  it('removes a stylesheet that is no longer enabled on a later call', () => {
    applyState({ styles: [style('a', '.a{}', true)], readability: false });
    applyState({ styles: [], readability: false });

    expect(stylesheet.removeStylesheet).toHaveBeenCalledWith('a');
  });

  it('removes a stylesheet that was disabled on a later call', () => {
    applyState({ styles: [style('a', '.a{}', true)], readability: false });
    applyState({ styles: [style('a', '.a{}', false)], readability: false });

    expect(stylesheet.removeStylesheet).toHaveBeenCalledWith('a');
  });

  it('does not remove a stylesheet that remains enabled', () => {
    applyState({ styles: [style('a', '.a{}', true)], readability: false });
    applyState({
      styles: [style('a', '.a{updated}', true)],
      readability: false,
    });

    expect(stylesheet.removeStylesheet).not.toHaveBeenCalled();
    expect(stylesheet.injectStylesheet).toHaveBeenLastCalledWith(
      'a',
      '.a{updated}',
      []
    );
  });
});
