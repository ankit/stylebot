jest.mock('./editor-window', () => ({ close: jest.fn() }));
jest.mock('./restore-tabs', () => ({
  restoreTab: jest.fn(async () => undefined),
}));
jest.mock('./side-panel', () => ({
  opensEditorInSidePanel: () =>
    (!!chrome.sidePanel || mockCanGrant) && mockDockedInSidePanel,
  onEditorSidePanelOpened: jest.fn(),
  openEditorSidePanelWithFallback: jest.fn(() => mockGrant),
}));
jest.mock('./styles', () => ({
  toggleForPage: jest.fn(async () => undefined),
  applyStylesToAllTabs: jest.fn(async () => undefined),
}));

import * as editorWindow from './editor-window';
import { restoreTab } from './restore-tabs';
import { applyStylesToAllTabs, toggleForPage } from './styles';
import { handleCommand } from './global-commands';
import { openEditorSidePanelWithFallback } from './side-panel';

let mockDockedInSidePanel = true;
let mockCanGrant = false;
let mockGrant: Promise<void> = Promise.resolve();

const PAGE = { id: 7, url: 'https://example.com/' } as chrome.tabs.Tab;

/**
 * Stands in for Chrome. `panelSetUp` says whether the tab's side panel is
 * set up, so open() succeeds; `panelOpen` whether it is showing already.
 */
const makeChrome = ({
  sidePanel = true,
  panelSetUp = false,
  panelOpen = false,
} = {}) => {
  const api = {
    runtime: {
      getURL: (path: string) => `chrome-extension://id/${path}`,
      getContexts: jest.fn(async () =>
        panelOpen
          ? [
              {
                documentUrl:
                  'chrome-extension://id/editor-window/index.html?tabId=7&host=sidepanel',
              },
            ]
          : []
      ),
      lastError: undefined,
    },
    tabs: {
      sendMessage: jest.fn(),
      get: jest.fn(async (tabId: number) => ({ id: tabId, url: PAGE.url })),
    },
    sidePanel: sidePanel
      ? {
          open: jest.fn(() =>
            panelSetUp
              ? Promise.resolve()
              : Promise.reject(new Error('No active side panel'))
          ),
          close: jest.fn(async () => undefined),
          setOptions: jest.fn(async () => undefined),
        }
      : undefined,
  };

  global.chrome = api as unknown as typeof chrome;
  return api;
};

const flush = () => new Promise(resolve => setTimeout(resolve));

describe('handleCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDockedInSidePanel = true;
    mockCanGrant = false;
    mockGrant = Promise.resolve();
  });

  it('asks the page to carry out a shortcut that acts on it', async () => {
    const api = makeChrome();

    handleCommand('readability', PAGE);
    await flush();

    expect(restoreTab).toBeCalledWith(7);
    expect(api.tabs.sendMessage).toBeCalledWith(
      7,
      { name: 'RunCommand', command: 'readability' },
      expect.any(Function)
    );
    expect(api.sidePanel?.open).not.toBeCalled();
  });

  it('opens the side panel set up on the tab, before awaiting anything', async () => {
    const api = makeChrome({ panelSetUp: true });

    handleCommand('stylebot', PAGE);
    expect(api.sidePanel?.open).toBeCalledWith({ tabId: 7 });

    await flush();
    expect(api.tabs.sendMessage).not.toBeCalled();
    expect(api.sidePanel?.close).not.toBeCalled();
  });

  it('closes the side panel when it is showing already', async () => {
    const api = makeChrome({ panelSetUp: true, panelOpen: true });

    handleCommand('stylebot', PAGE);
    await flush();

    expect(api.sidePanel?.close).toBeCalledWith({ tabId: 7 });
    expect(api.tabs.sendMessage).not.toBeCalled();
  });

  it('leaves the editor to the page where the side panel can’t open', async () => {
    const api = makeChrome({ panelSetUp: false });

    handleCommand('stylebot', PAGE);
    await flush();

    expect(api.tabs.sendMessage).toBeCalledWith(
      7,
      { name: 'RunCommand', command: 'stylebot' },
      expect.any(Function)
    );
  });

  it('leaves the editor to the page where the side panel isn’t the dock', async () => {
    mockDockedInSidePanel = false;
    const api = makeChrome({ panelSetUp: true });

    handleCommand('stylebot', PAGE);
    await flush();

    expect(api.sidePanel?.open).not.toBeCalled();
    expect(api.tabs.sendMessage).toBeCalledWith(
      7,
      { name: 'RunCommand', command: 'stylebot' },
      expect.any(Function)
    );
  });

  it('asks for the side panel without its permission, leaving the page alone', async () => {
    mockCanGrant = true;
    const api = makeChrome({ sidePanel: false });

    handleCommand('stylebot', PAGE);
    await flush();

    expect(openEditorSidePanelWithFallback).toBeCalledWith(7);
    expect(api.tabs.sendMessage).not.toBeCalled();
  });

  it('leaves the editor to the page when the side panel permission is refused', async () => {
    mockCanGrant = true;
    mockGrant = Promise.reject(new Error('Refused'));
    const api = makeChrome({ sidePanel: false });

    handleCommand('stylebot', PAGE);
    await flush();

    expect(api.tabs.sendMessage).toBeCalledWith(
      7,
      { name: 'RunCommand', command: 'stylebot' },
      expect.any(Function)
    );
  });

  it('leaves the editor to the page in a browser without a side panel', async () => {
    const api = makeChrome({ sidePanel: false });

    handleCommand('stylebot', PAGE);
    await flush();

    expect(api.tabs.sendMessage).toBeCalledWith(
      7,
      { name: 'RunCommand', command: 'stylebot' },
      expect.any(Function)
    );
  });

  it('acts on the edited tab when the separate editor window has focus', async () => {
    const api = makeChrome();
    const editorWindowTab = {
      id: 20,
      url: 'chrome-extension://id/editor-window/index.html?tabId=7',
    } as chrome.tabs.Tab;

    handleCommand('stylebot', editorWindowTab);
    handleCommand('readability', editorWindowTab);
    await flush();

    expect(editorWindow.close).toBeCalledWith(7);
    expect(api.tabs.sendMessage).toBeCalledWith(
      7,
      { name: 'RunCommand', command: 'readability' },
      expect.any(Function)
    );
  });

  it('toggles styling itself, without loading the editor in the page', async () => {
    const api = makeChrome();

    handleCommand('style', PAGE);
    await flush();

    expect(api.tabs.get).toBeCalledWith(7);
    expect(toggleForPage).toBeCalledWith(PAGE.url);
    expect(applyStylesToAllTabs).toBeCalled();
    expect(api.tabs.sendMessage).not.toBeCalled();
  });

  it('ignores pages Stylebot can’t run on and unknown commands', () => {
    const api = makeChrome();

    handleCommand('stylebot', {
      id: 3,
      url: 'chrome://settings',
    } as chrome.tabs.Tab);
    handleCommand('unknown', PAGE);

    expect(api.tabs.sendMessage).not.toBeCalled();
    expect(api.sidePanel?.open).not.toBeCalled();
  });
});
