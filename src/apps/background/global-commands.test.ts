jest.mock('./editor-window', () => ({ close: jest.fn() }));

import * as editorWindow from './editor-window';
import { handleCommand } from './global-commands';

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
    tabs: { sendMessage: jest.fn() },
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
  });

  it('asks the page to carry out a shortcut that acts on it', () => {
    const api = makeChrome();

    handleCommand('readability', PAGE);

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

  it('leaves the editor to the page where the side panel isn’t the dock', async () => {
    const api = makeChrome({ panelSetUp: false });

    handleCommand('stylebot', PAGE);
    await flush();

    expect(api.tabs.sendMessage).toBeCalledWith(
      7,
      { name: 'RunCommand', command: 'stylebot' },
      expect.any(Function)
    );
  });

  it('leaves the editor to the page in a browser without a side panel', () => {
    const api = makeChrome({ sidePanel: false });

    handleCommand('stylebot', PAGE);

    expect(api.tabs.sendMessage).toBeCalledWith(
      7,
      { name: 'RunCommand', command: 'stylebot' },
      expect.any(Function)
    );
  });

  it('acts on the edited tab when the separate editor window has focus', () => {
    const api = makeChrome();
    const editorWindowTab = {
      id: 20,
      url: 'chrome-extension://id/editor-window/index.html?tabId=7',
    } as chrome.tabs.Tab;

    handleCommand('stylebot', editorWindowTab);
    handleCommand('style', editorWindowTab);

    expect(editorWindow.close).toBeCalledWith(7);
    expect(api.tabs.sendMessage).toBeCalledWith(
      7,
      { name: 'RunCommand', command: 'style' },
      expect.any(Function)
    );
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
