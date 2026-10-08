import { isEditorSidePanelOpen } from '@stylebot/utils';

import * as editorWindow from '../editor-window';
import { findOpenEditors, restoreOpenTabs } from './restore-tabs';

jest.mock('../editor-window', () => ({ isOpen: jest.fn(), open: jest.fn() }));
jest.mock('@stylebot/utils', () => ({
  isEditorSidePanelOpen: jest.fn(),
  supportsEditorSidePanel: () => true,
}));

const sidePanelOpen = jest.fn();

const executeScript = jest.fn();
const sendMessage = jest.fn();

beforeEach(() => {
  executeScript.mockReset().mockResolvedValue([]);
  sendMessage.mockReset().mockResolvedValue(undefined);

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
    await restoreOpenTabs();

    expect(chrome.tabs.query).toBeCalledWith({ url: ['<all_urls>'] });
    expect(
      executeScript.mock.calls.map(([call]) => call).filter(call => call.files)
    ).toEqual([
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

  it('opens Stylebot again in the tabs it was open in', async () => {
    await restoreOpenTabs({ 1: 'page', 2: 'window', 3: 'sidepanel' });

    expect(sendMessage).toBeCalledWith(1, { name: 'OpenStylebot' });
    expect(editorWindow.open).toBeCalledWith(2);
    expect(sidePanelOpen).toBeCalledWith({ tabId: 3 });
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
