import { getPageSupport, isEditorSidePanelOpen } from '@stylebot/utils';

import * as editorWindow from './editor-window';
import { findOpenEditors, restoreOpenTabs } from './restore-tabs';

jest.mock('./editor-window', () => ({ isOpen: jest.fn(), open: jest.fn() }));
jest.mock('@stylebot/utils', () => ({
  getPageSupport: jest.fn(),
  isEditorSidePanelOpen: jest.fn(),
  supportsEditorSidePanel: () => true,
}));

const sidePanelOpen = jest.fn();

const executeScript = jest.fn();
const sendMessage = jest.fn();

// Tabs whose page still answers, as one loaded since the reload does.
let connected: Array<number>;

const injected = () =>
  executeScript.mock.calls.map(([call]) => call).filter(call => call.files);

beforeEach(() => {
  connected = [];
  executeScript.mockReset().mockResolvedValue([]);
  sendMessage.mockReset().mockResolvedValue(undefined);
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
      query: jest.fn(async () => [{ id: 1 }, { id: 2 }, {}]),
      sendMessage,
    },
    scripting: { executeScript },
    sidePanel: { open: sidePanelOpen },
  } as unknown as typeof chrome;
});

describe('restoreOpenTabs', () => {
  it('runs each content script again in the tabs it matches, in its frames', async () => {
    await restoreOpenTabs({});

    expect(chrome.tabs.query).toBeCalledWith({
      url: ['<all_urls>'],
      discarded: false,
    });
    expect(injected()).toEqual([
      { target: { tabId: 1, allFrames: false }, files: ['editor/index.js'] },
      { target: { tabId: 1, allFrames: true }, files: ['inject-css/index.js'] },
      { target: { tabId: 2, allFrames: false }, files: ['editor/index.js'] },
      { target: { tabId: 2, allFrames: true }, files: ['inject-css/index.js'] },
    ]);
  });

  it('leaves alone a tab whose page still answers', async () => {
    connected = [2];

    await restoreOpenTabs({});

    expect(getPageSupport).toBeCalledWith({ id: 2 });
    expect(injected().map(call => call.target.tabId)).toEqual([1, 1]);
  });

  it('injects once when two restores find the same tab', async () => {
    executeScript.mockImplementation(async ({ target }) => {
      connected.push(target.tabId);
      return [];
    });

    await Promise.all([restoreOpenTabs({}), restoreOpenTabs({})]);

    expect(injected()).toHaveLength(4);
  });

  it('carries on past a tab it may not script', async () => {
    executeScript.mockRejectedValueOnce(
      new Error('Cannot access a chrome:// URL')
    );

    await expect(restoreOpenTabs({})).resolves.toBeUndefined();
    expect(executeScript).toBeCalledTimes(4);
  });

  it('opens Stylebot again in the tabs it was open in', async () => {
    await restoreOpenTabs({ 1: 'page', 2: 'window', 3: 'sidepanel' });

    expect(sendMessage).toBeCalledWith(1, { name: 'OpenStylebot' });
    expect(editorWindow.open).toBeCalledWith(2);
    expect(sidePanelOpen).toBeCalledWith({ tabId: 3 });
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
