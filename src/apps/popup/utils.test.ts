import { getPageSupport } from '@stylebot/utils';
import type { GetPublishedGalleryStyleResponse } from '@stylebot/types';

import {
  getCommands,
  getOption,
  getRestoredPageSupport,
  getPublishMenuItem,
  getStyles,
  onEnterOrSpace,
  openStylebotSidePanel,
} from './utils';

jest.mock('@stylebot/utils', () => ({
  ...jest.requireActual('@stylebot/utils'),
  getPageSupport: jest.fn(),
}));

const keydown = (key: string): KeyboardEvent =>
  new KeyboardEvent('keydown', { key });

describe('onEnterOrSpace', () => {
  it('should call the handler and prevent default on Enter', () => {
    const event = keydown('Enter');
    const preventDefault = jest.spyOn(event, 'preventDefault');
    const handler = jest.fn();

    onEnterOrSpace(event, handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('should call the handler and prevent default on Space', () => {
    const event = keydown(' ');
    const preventDefault = jest.spyOn(event, 'preventDefault');
    const handler = jest.fn();

    onEnterOrSpace(event, handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('should ignore other keys', () => {
    const event = keydown('Tab');
    const preventDefault = jest.spyOn(event, 'preventDefault');
    const handler = jest.fn();

    onEnterOrSpace(event, handler);

    expect(handler).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });
});

describe('getStyles', () => {
  const stored = {
    'example.com': { css: 'a { color: red; }', enabled: true },
    'example.com/docs': { css: 'p { color: blue; }', enabled: false },
    'other.com': { css: 'h1 { color: green; }', enabled: true },
  };

  beforeEach(() => {
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((_key, cb) => cb({ styles: stored })),
        },
      },
      runtime: { sendMessage: jest.fn() },
    } as unknown as typeof chrome;
  });

  it("should read the tab's styles from storage without messaging the background", () => {
    const callback = jest.fn();

    getStyles({ url: 'https://example.com/docs' } as chrome.tabs.Tab, callback);

    const { styles, defaultStyle } = callback.mock.calls[0][0];
    expect(styles.map((style: { url: string }) => style.url)).toEqual([
      'example.com',
      'example.com/docs',
    ]);
    expect(defaultStyle.url).toBe('example.com/docs');
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });
});

describe('getOption and getCommands', () => {
  const mockStorage = (items: Record<string, unknown>) => {
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((key: string, cb) => cb({ [key]: items[key] })),
        },
      },
      runtime: { sendMessage: jest.fn() },
    } as unknown as typeof chrome;
  };

  it('should read a stored option without messaging the background', () => {
    mockStorage({ options: { appearance: 'dark' } });
    const callback = jest.fn();

    getOption('appearance', callback);

    expect(callback).toHaveBeenCalledWith('dark');
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('should fall back to the default for an option missing from storage', () => {
    mockStorage({ options: {} });
    const callback = jest.fn();

    getOption('appearance', callback);

    expect(callback).toHaveBeenCalledWith('system');
  });

  it('should read the shortcuts from the browser without messaging the background', async () => {
    mockStorage({});
    (chrome as unknown as { commands: unknown }).commands = {
      getAll: jest.fn(() =>
        Promise.resolve([
          { name: 'stylebot', shortcut: 'Alt+Shift+M' },
          { name: 'style', shortcut: '' },
          { name: 'readability', shortcut: 'Ctrl+Shift+R' },
          { name: '_execute_action', shortcut: '' },
        ])
      ),
    };
    const callback = jest.fn();

    getCommands(callback);
    await Promise.resolve();
    await Promise.resolve();

    expect(callback).toHaveBeenCalledWith({
      stylebot: 'alt+shift+m',
      style: '',
      readability: 'ctrl+shift+r',
      grayscale: '',
    });
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });
});

describe('getRestoredPageSupport', () => {
  const tab = { id: 3, url: 'https://example.com/' } as chrome.tabs.Tab;
  const sendMessage = jest.fn((_message, callback) => callback());
  let session: Record<string, unknown>;

  beforeEach(() => {
    sendMessage.mockClear();
    session = { 'restore-tab-3': [0, 1] };
    global.chrome = {
      runtime: { sendMessage, lastError: undefined },
      storage: {
        session: {
          get: jest.fn(async (key: string) => ({ [key]: session[key] })),
        },
      },
    } as unknown as typeof chrome;
  });

  it('restores a page that does not answer, then asks it again', async () => {
    (getPageSupport as jest.Mock)
      .mockResolvedValueOnce('unreachable')
      .mockResolvedValueOnce('supported');

    expect(await getRestoredPageSupport(tab)).toBe('supported');
    expect(sendMessage).toBeCalledWith(
      { name: 'RestoreTab', tabId: 3 },
      expect.any(Function)
    );
  });

  it('leaves the background asleep for a page no update left for later', async () => {
    session = {};
    (getPageSupport as jest.Mock).mockResolvedValueOnce('unreachable');

    expect(await getRestoredPageSupport(tab)).toBe('unreachable');
    expect(sendMessage).not.toBeCalled();
  });

  it('leaves alone a page that answers', async () => {
    (getPageSupport as jest.Mock).mockResolvedValueOnce('supported');

    expect(await getRestoredPageSupport(tab)).toBe('supported');
    expect(sendMessage).not.toBeCalled();
  });

  it('leaves alone a browser page', async () => {
    (getPageSupport as jest.Mock).mockResolvedValueOnce('unreachable');

    expect(
      await getRestoredPageSupport({
        id: 3,
        url: 'chrome://settings',
      } as chrome.tabs.Tab)
    ).toBe('unreachable');
    expect(sendMessage).not.toBeCalled();
  });
});

describe('openStylebotSidePanel', () => {
  const tab = { id: 7 } as chrome.tabs.Tab;

  const makeChrome = ({ sidePanel = false, granted = true } = {}) => {
    const api = {
      runtime: {
        getManifest: () => ({ optional_permissions: ['sidePanel'] }),
        sendMessage: jest.fn(async () => granted),
      },
      tabs: { sendMessage: jest.fn() },
      sidePanel: sidePanel
        ? { open: jest.fn(async () => undefined), setOptions: jest.fn() }
        : undefined,
    };

    global.chrome = api as unknown as typeof chrome;
    return api;
  };

  const flush = () => new Promise(resolve => setTimeout(resolve));

  beforeEach(() => {
    jest.spyOn(window, 'close').mockImplementation(() => undefined);
  });

  it('opens the side panel from the click with the permission', async () => {
    const api = makeChrome({ sidePanel: true });

    openStylebotSidePanel(tab);
    await flush();

    expect(api.sidePanel?.open).toBeCalledWith({ tabId: 7 });
    expect(api.runtime.sendMessage).toBeCalledWith({
      name: 'EditorSidePanelOpened',
      tabId: 7,
    });
  });

  it('has the background ask for the permission without it', async () => {
    const api = makeChrome();

    openStylebotSidePanel(tab);
    await flush();

    expect(api.runtime.sendMessage).toBeCalledWith({
      name: 'OpenEditorSidePanel',
      tabId: 7,
    });
    expect(api.tabs.sendMessage).not.toBeCalled();
    expect(window.close).toBeCalled();
  });

  it('opens the editor in the page when the permission is refused', async () => {
    const api = makeChrome({ granted: false });

    openStylebotSidePanel(tab);
    await flush();

    expect(api.tabs.sendMessage).toBeCalledWith(7, {
      name: 'ToggleStylebot',
    });
  });
});

describe('getPublishMenuItem', () => {
  const answer = (response: GetPublishedGalleryStyleResponse) => {
    global.chrome = {
      runtime: { sendMessage: jest.fn(async () => response) },
    } as unknown as typeof chrome;
  };

  it('offers what the editor offers for a style of yours', async () => {
    answer({ published: null, installed: null });

    expect(await getPublishMenuItem('example.com', 'p', 'h1 {}')).toEqual({
      label: 'publish_to_gallery',
      changed: false,
    });
  });

  it("links someone else's installed style to its Gallery page", async () => {
    answer({
      published: null,
      installed: { id: 2, slug: 's', cssHash: 'abc' },
    });

    expect(await getPublishMenuItem('example.com', 'p', 'h1 {}')).toEqual({
      label: 'view_in_gallery',
      changed: false,
      url: expect.stringMatching(/\/style\/2\/s$/),
    });
  });
});
