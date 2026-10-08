import { restoreOpenTabs } from './restore-tabs';

const executeScript = jest.fn();

beforeEach(() => {
  executeScript.mockReset().mockResolvedValue([]);

  global.chrome = {
    runtime: {
      getManifest: () => ({
        content_scripts: [
          { matches: ['<all_urls>'], js: ['editor/index.js'] },
          {
            matches: ['<all_urls>'],
            js: ['inject-css/index.js'],
            all_frames: true,
          },
        ],
      }),
    },
    tabs: {
      query: jest.fn(async () => [{ id: 1 }, { id: 2 }, {}]),
    },
    scripting: { executeScript },
  } as unknown as typeof chrome;
});

describe('restoreOpenTabs', () => {
  it('runs each content script again in the tabs it matches, in its frames', async () => {
    await restoreOpenTabs();

    expect(chrome.tabs.query).toBeCalledWith({ url: ['<all_urls>'] });
    expect(executeScript.mock.calls.map(([call]) => call)).toEqual([
      { target: { tabId: 1, allFrames: false }, files: ['editor/index.js'] },
      { target: { tabId: 2, allFrames: false }, files: ['editor/index.js'] },
      { target: { tabId: 1, allFrames: true }, files: ['inject-css/index.js'] },
      { target: { tabId: 2, allFrames: true }, files: ['inject-css/index.js'] },
    ]);
  });

  it('carries on past a tab it may not script', async () => {
    executeScript.mockRejectedValueOnce(
      new Error('Cannot access a chrome:// URL')
    );

    await expect(restoreOpenTabs()).resolves.toBeUndefined();
    expect(executeScript).toBeCalledTimes(4);
  });

  it('does nothing without scripting', async () => {
    delete (chrome as { scripting?: unknown }).scripting;

    await restoreOpenTabs();

    expect(chrome.tabs.query).not.toBeCalled();
  });
});
