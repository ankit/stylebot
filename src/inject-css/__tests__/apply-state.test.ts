import { CachedState } from '../cache';

jest.mock('@stylebot/css');
jest.mock('@stylebot/readability');

describe('applyState', () => {
  let css: typeof import('@stylebot/css');
  let readability: typeof import('@stylebot/readability');
  let applyState: typeof import('../apply-state').applyState;

  beforeEach(() => {
    // appliedUrls is module-level state, tracking what's currently
    // injected across calls — reset the module so each test starts clean.
    jest.resetModules();

    css = require('@stylebot/css');
    readability = require('@stylebot/readability');
    ({ applyState } = require('../apply-state'));

    (css.injectCSSIntoDocument as jest.Mock).mockResolvedValue(undefined);
  });

  it('injects only the enabled styles', async () => {
    const state: CachedState = {
      styles: [
        { url: 'a', css: '.a{}', enabled: true },
        { url: 'b', css: '.b{}', enabled: false },
      ],
      readability: false,
    };

    await applyState(state);

    expect(css.injectCSSIntoDocument).toHaveBeenCalledTimes(1);
    expect(css.injectCSSIntoDocument).toHaveBeenCalledWith('.a{}', 'a');
  });

  it('applies readability when the state calls for it', async () => {
    await applyState({ styles: [], readability: true });

    expect(readability.apply).toHaveBeenCalledTimes(1);
    expect(readability.remove).not.toHaveBeenCalled();
  });

  it('removes readability when the state does not call for it', async () => {
    await applyState({ styles: [], readability: false });

    expect(readability.remove).toHaveBeenCalledTimes(1);
    expect(readability.apply).not.toHaveBeenCalled();
  });

  it('removes a stylesheet that is no longer enabled on a later call', async () => {
    await applyState({
      styles: [{ url: 'a', css: '.a{}', enabled: true }],
      readability: false,
    });

    await applyState({ styles: [], readability: false });

    expect(css.removeCSSFromDocument).toHaveBeenCalledWith('a');
  });

  it('removes a stylesheet that was disabled on a later call', async () => {
    await applyState({
      styles: [{ url: 'a', css: '.a{}', enabled: true }],
      readability: false,
    });

    await applyState({
      styles: [{ url: 'a', css: '.a{}', enabled: false }],
      readability: false,
    });

    expect(css.removeCSSFromDocument).toHaveBeenCalledWith('a');
  });

  it('does not remove a stylesheet that remains enabled', async () => {
    await applyState({
      styles: [{ url: 'a', css: '.a{}', enabled: true }],
      readability: false,
    });

    await applyState({
      styles: [{ url: 'a', css: '.a{updated}', enabled: true }],
      readability: false,
    });

    expect(css.removeCSSFromDocument).not.toHaveBeenCalled();
    expect(css.injectCSSIntoDocument).toHaveBeenLastCalledWith(
      '.a{updated}',
      'a'
    );
  });
});
