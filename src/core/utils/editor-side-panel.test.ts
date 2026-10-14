import {
  SIDE_PANEL_IGNORED_KEY,
  markSidePanelUnusableInArc,
} from './editor-side-panel';

beforeEach(() => {
  jest.useFakeTimers();
  document.documentElement.removeAttribute('style');
  global.chrome = {
    storage: { local: { set: jest.fn(() => Promise.resolve()) } },
  } as unknown as typeof chrome;
});

afterEach(() => jest.useRealTimers());

describe('markSidePanelUnusableInArc', () => {
  it('marks the side panel unusable once Arc adds its palette', async () => {
    const marked = markSidePanelUnusableInArc();
    await jest.advanceTimersByTimeAsync(500);
    document.documentElement.style.setProperty('--arc-palette-title', '#fff');
    await jest.advanceTimersByTimeAsync(500);

    await expect(marked).resolves.toBe(true);
    expect(chrome.storage.local.set).toBeCalledWith({
      [SIDE_PANEL_IGNORED_KEY]: true,
    });
  });

  it('leaves the side panel alone in other browsers', async () => {
    const marked = markSidePanelUnusableInArc();
    await jest.advanceTimersByTimeAsync(3000);

    await expect(marked).resolves.toBe(false);
    expect(chrome.storage.local.set).not.toBeCalled();
  });
});
