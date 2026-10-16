import { getPageSupport } from '@stylebot/utils';
import { isEditorSidePanelOpen } from '@stylebot/side-panel';

import * as editorWindow from './editor-window';
import { findOpenEditors, restoreOpenTabs, restoreTab } from './restore-tabs';

jest.mock('./editor-window', () => ({ isOpen: jest.fn(), open: jest.fn() }));
jest.mock('@stylebot/utils', () => ({
  getPageSupport: jest.fn(),
  getRestorePendingKey: (tabId: number) => `restore-tab-${tabId}`,
}));
jest.mock('@stylebot/side-panel', () => ({
  isEditorSidePanelOpen: jest.fn(),
  isSidePanelGranted: () => !!chrome.sidePanel,
}));

const sidePanelOpen = jest.fn();

const executeScript = jest.fn();
const sendMessage = jest.fn();

// Tabs whose page still answers, as one loaded since the reload does.
let connected: Array<number>;
let session: Record<string, unknown>;
let tabs: Array<chrome.tabs.Tab>;

const injected = () =>
  executeScript.mock.calls.map(([call]) => call).filter(call => call.files);

beforeEach(() => {
  connected = [];
  session = {};
  tabs = [{ id: 1, active: true }, { id: 2 }, {}] as Array<chrome.tabs.Tab>;
  executeScript.mockReset().mockResolvedValue([]);
  sendMessage.mockReset().mockResolvedValue(undefined);
  sidePanelOpen.mockReset();
  (getPageSupport as jest.Mock).mockImplementation(
    async ({ id }: chrome.tabs.Tab) =>
      connected.includes(id ?? -1) ? 'supported' : 'unreachable'
  );
  (editorWindow.isOpen as jest.Mock).mockResolvedValue(false);
  (isEditorSidePanelOpen as jest.Mock).mockResolvedValue(false);

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
      query: jest.fn(async ({ active }: chrome.tabs.QueryInfo) =>
        active ? tabs.filter(tab => tab.active) : tabs
      ),
      get: jest.fn(async (tabId: number) => {
        const tab = tabs.find(({ id }) => id === tabId);
        if (!tab) {
          throw new Error('No tab');
        }
        return tab;
      }),
      sendMessage,
    },
    storage: {
      session: {
        get: jest.fn(async (key: string) =>
          key in session ? { [key]: session[key] } : {}
        ),
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(session, items);
        }),
        remove: jest.fn(async (key: string) => {
          delete session[key];
        }),
      },
    },
    scripting: { executeScript },
    sidePanel: { open: sidePanelOpen },
  } as unknown as typeof chrome;
});

describe('restoreOpenTabs', () => {
  it('runs each content script again in the active tab, in its frames', async () => {
    await restoreOpenTabs({});

    expect(chrome.tabs.query).toBeCalledWith({
      url: ['<all_urls>'],
      discarded: false,
    });
    expect(injected()).toEqual([
      { target: { tabId: 1, allFrames: false }, files: ['editor/index.js'] },
      { target: { tabId: 1, allFrames: true }, files: ['inject-css/index.js'] },
    ]);
  });

  it('runs the scripts right away in a tab with Stylebot open', async () => {
    await restoreOpenTabs({ 2: 'window' });

    expect(injected().map(call => call.target.tabId)).toEqual([1, 1, 2, 2]);
    expect(editorWindow.open).toBeCalledWith(2);
  });

  it('leaves alone an active tab whose page still answers', async () => {
    connected = [1];

    await restoreOpenTabs({});

    expect(getPageSupport).toBeCalledWith(tabs[0]);
    expect(injected()).toEqual([]);
  });

  it('injects once when two restores find the same tab', async () => {
    executeScript.mockImplementation(async ({ target }) => {
      connected.push(target.tabId);
      return [];
    });

    await Promise.all([restoreOpenTabs({}), restoreOpenTabs({})]);

    expect(injected()).toHaveLength(2);
  });

  it('carries on past a tab it may not script', async () => {
    executeScript.mockRejectedValueOnce(
      new Error('Cannot access a chrome:// URL')
    );

    await expect(restoreOpenTabs({})).resolves.toBeUndefined();
    expect(executeScript).toBeCalledTimes(2);
  });

  it('opens Stylebot again in the tabs it was open in', async () => {
    await restoreOpenTabs({ 1: 'page', 2: 'window', 3: 'sidepanel' });

    expect(sendMessage).toBeCalledWith(1, { name: 'OpenStylebot' });
    expect(editorWindow.open).toBeCalledWith(2);
    expect(sidePanelOpen).toBeCalledWith({ tabId: 3 });
  });

  it('leaves the side panel shut without its permission', async () => {
    delete (chrome as Partial<typeof chrome>).sidePanel;

    await restoreOpenTabs({ 3: 'sidepanel' });

    expect(isEditorSidePanelOpen).not.toBeCalled();
    expect(sidePanelOpen).not.toBeCalled();
  });

  it('opens Stylebot again where a cut-off panel is left, when not told where', async () => {
    executeScript.mockImplementation(async ({ target, func }) =>
      func ? [{ result: target.tabId === 2 }] : []
    );

    await restoreOpenTabs();

    expect(sendMessage).toBeCalledWith(2, { name: 'OpenStylebot' });
    expect(sendMessage).not.toBeCalledWith(1, { name: 'OpenStylebot' });
  });

  it('carries on when a tab will not reopen', async () => {
    sendMessage.mockRejectedValue(new Error('closed'));

    await expect(
      restoreOpenTabs({ 1: 'page', 2: 'window' })
    ).resolves.toBeUndefined();
    expect(editorWindow.open).toBeCalledWith(2);
  });

  it('finds where Stylebot is open in each tab', async () => {
    (editorWindow.isOpen as jest.Mock).mockImplementation(
      async (tabId: number) => tabId === 2
    );
    (isEditorSidePanelOpen as jest.Mock).mockImplementation(
      async (tabId: number) => tabId === 3
    );
    chrome.tabs.query = jest.fn(async () => [
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
    ]) as never;
    executeScript.mockImplementation(async ({ target }) => [
      { result: target.tabId === 1 },
    ]);

    expect(await findOpenEditors()).toEqual({
      1: 'page',
      2: 'window',
      3: 'sidepanel',
    });
  });

  it('does nothing without scripting', async () => {
    delete (chrome as { scripting?: unknown }).scripting;

    await restoreOpenTabs();

    expect(chrome.tabs.query).not.toBeCalled();
  });
});

describe('restoreTab', () => {
  it('runs the scripts in a tab left for later, once', async () => {
    await restoreOpenTabs({});
    executeScript.mockClear();

    await restoreTab(2);
    await restoreTab(2);

    expect(injected()).toEqual([
      { target: { tabId: 2, allFrames: false }, files: ['editor/index.js'] },
      { target: { tabId: 2, allFrames: true }, files: ['inject-css/index.js'] },
    ]);
  });

  it('injects once when the tab is restored twice at the same time', async () => {
    await restoreOpenTabs({});
    executeScript.mockClear();

    await Promise.all([restoreTab(2), restoreTab(2)]);

    expect(injected()).toHaveLength(2);
  });

  it('leaves alone a tab left for later whose page loaded since', async () => {
    await restoreOpenTabs({});
    executeScript.mockClear();
    connected = [2];

    await restoreTab(2);

    expect(injected()).toEqual([]);
  });

  it('keeps a discarded tab for later', async () => {
    await restoreOpenTabs({});
    executeScript.mockClear();
    tabs[1].discarded = true;

    await restoreTab(2);
    expect(injected()).toEqual([]);

    tabs[1].discarded = false;
    await restoreTab(2);
    expect(injected()).toHaveLength(2);
  });

  it('restores a tab shown while the update was sorting the tabs', async () => {
    const queried = chrome.tabs.query as jest.Mock;
    queried.mockImplementation(async ({ active }: chrome.tabs.QueryInfo) => {
      if (!active) {
        return tabs.map(tab => ({ ...tab }));
      }
      tabs[1].active = true;
      return tabs.filter(tab => tab.active);
    });

    await restoreOpenTabs({});

    expect(
      injected()
        .map(call => call.target.tabId)
        .sort()
    ).toEqual([1, 1, 2, 2]);
  });

  it('does nothing in a tab no restore left for later', async () => {
    await restoreTab(2);

    expect(executeScript).not.toBeCalled();
  });
});
