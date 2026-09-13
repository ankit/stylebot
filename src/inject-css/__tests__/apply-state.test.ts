import { CachedState } from '../cache';

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

jest.mock('@stylebot/css');
// applyReadability is dynamically imported (import('@stylebot/readability'))
// so its Defuddle/Vue dependency chain isn't in the eager inject-css bundle.
jest.mock('@stylebot/readability');
// removeReadability bypasses that barrel (see apply-state.ts) since it
// doesn't need Defuddle/Vue — mocked separately here for the same reason.
jest.mock('../../readability/lifecycle/remove-readability');

describe('applyState', () => {
  let css: typeof import('@stylebot/css');
  let readability: typeof import('@stylebot/readability');
  let removeReadabilityModule: typeof import('../../readability/lifecycle/remove-readability');
  let applyState: typeof import('../apply-state').applyState;

  beforeEach(() => {
    // appliedUrls is module-level state, tracking what's currently
    // injected across calls — reset the module so each test starts clean.
    jest.resetModules();

    css = require('@stylebot/css');
    readability = require('@stylebot/readability');
    removeReadabilityModule = require('../../readability/lifecycle/remove-readability');
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
    // applyReadability is dynamically imported — its own .then() isn't part
    // of applyState's returned promise (see apply-state.ts), so give it a
    // tick to run rather than relying on incidental microtask ordering.
    await flushPromises();

    expect(readability.applyReadability).toHaveBeenCalledTimes(1);
    expect(removeReadabilityModule.removeReadability).not.toHaveBeenCalled();
  });

  it('removes readability when the state does not call for it', async () => {
    await applyState({ styles: [], readability: false });

    expect(removeReadabilityModule.removeReadability).toHaveBeenCalledTimes(1);
    expect(readability.applyReadability).not.toHaveBeenCalled();
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
