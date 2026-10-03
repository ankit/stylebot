jest.mock('./styles');
jest.mock('./color-history');
jest.mock('./editor-window');

import {
  SetReadability,
  ReadabilityActiveChanged,
  GetRecentColors,
  AddRecentColor,
  OpenOptionsPage,
  OpenShortcutsPage,
} from './messages';
import * as stylesModule from './styles';
import * as colorHistoryModule from './color-history';

describe('SetReadability', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.chrome = {
      tabs: { sendMessage: jest.fn() },
    } as unknown as typeof chrome;
  });

  it('persists the value and refreshes the badge for the sending tab', async () => {
    const tab = {
      id: 1,
      url: 'https://example.com/article',
    } as chrome.tabs.Tab;

    await SetReadability(
      { name: 'SetReadability', url: 'example.com', value: true },
      { tab }
    );

    expect(stylesModule.setReadability).toBeCalledWith('example.com', true);
    expect(stylesModule.refreshBadgeForTab).toBeCalledWith(tab);
  });

  it('relays the change to the sending tab so other content scripts stay in sync', async () => {
    const tab = {
      id: 1,
      url: 'https://example.com/article',
    } as chrome.tabs.Tab;

    await SetReadability(
      { name: 'SetReadability', url: 'example.com', value: true },
      { tab }
    );

    expect(chrome.tabs.sendMessage).toBeCalledWith(1, {
      name: 'ReadabilityStateChanged',
      value: true,
    });
  });

  it('does not attempt to update the badge when there is no sending tab', async () => {
    await SetReadability(
      { name: 'SetReadability', url: 'example.com', value: true },
      {}
    );

    expect(stylesModule.setReadability).toBeCalledWith('example.com', true);
    expect(stylesModule.refreshBadgeForTab).not.toBeCalled();
  });
});

describe('ReadabilityActiveChanged', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('refreshes the badge for the sending tab', async () => {
    const tab = {
      id: 1,
      url: 'https://example.com/article',
    } as chrome.tabs.Tab;

    await ReadabilityActiveChanged(
      { name: 'ReadabilityActiveChanged' },
      { tab }
    );

    expect(stylesModule.refreshBadgeForTab).toBeCalledWith(tab);
  });

  it('does nothing when there is no sending tab', async () => {
    await ReadabilityActiveChanged({ name: 'ReadabilityActiveChanged' }, {});

    expect(stylesModule.refreshBadgeForTab).not.toBeCalled();
  });
});

describe('GetRecentColors', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('responds with the stored recent colors', async () => {
    (colorHistoryModule.getAll as jest.Mock).mockResolvedValue(['#ff0000']);
    const sendResponse = jest.fn();

    await GetRecentColors(sendResponse);

    expect(sendResponse).toBeCalledWith(['#ff0000']);
  });
});

describe('AddRecentColor', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('adds the color to history and responds with the updated list', async () => {
    (colorHistoryModule.add as jest.Mock).mockResolvedValue([
      '#00ff00',
      '#ff0000',
    ]);
    const sendResponse = jest.fn();

    await AddRecentColor(
      { name: 'AddRecentColor', color: '#00ff00' },
      sendResponse
    );

    expect(colorHistoryModule.add).toBeCalledWith('#00ff00');
    expect(sendResponse).toBeCalledWith(['#00ff00', '#ff0000']);
  });
});

describe('OpenOptionsPage', () => {
  const base = 'chrome-extension://abc/options.html';

  const mockChrome = (tabs: Array<Partial<chrome.tabs.Tab>>) => {
    global.chrome = {
      runtime: {
        getURL: jest.fn((path: string) => `chrome-extension://abc/${path}`),
      },
      tabs: {
        query: jest.fn().mockResolvedValue(tabs),
        update: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue(undefined),
      },
      windows: { update: jest.fn().mockResolvedValue(undefined) },
    } as unknown as typeof chrome;
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('opens a new tab when no options tab exists', async () => {
    mockChrome([{ id: 1, url: 'https://example.com' }]);

    await OpenOptionsPage();

    expect(chrome.tabs.create).toBeCalledWith({ url: base, active: true });
    expect(chrome.tabs.update).not.toBeCalled();
  });

  it('appends the requested route as the hash', async () => {
    mockChrome([]);

    await OpenOptionsPage({ route: '/styles/edit?url=example.com' });

    expect(chrome.tabs.create).toBeCalledWith({
      url: `${base}#/styles/edit?url=example.com`,
      active: true,
    });
  });

  it('focuses an existing options tab without touching its route', async () => {
    mockChrome([{ id: 7, windowId: 3, url: `${base}#/sync` }]);

    await OpenOptionsPage();

    expect(chrome.tabs.update).toBeCalledWith(7, { active: true });
    expect(chrome.windows.update).toBeCalledWith(3, { focused: true });
    expect(chrome.tabs.create).not.toBeCalled();
  });

  it('routes an existing options tab when a route is requested', async () => {
    mockChrome([{ id: 7, windowId: 3, url: `${base}#/sync` }]);

    await OpenOptionsPage({ route: '/basics' });

    expect(chrome.tabs.update).toBeCalledWith(7, {
      active: true,
      url: `${base}#/basics`,
    });
    expect(chrome.tabs.create).not.toBeCalled();
  });
});

describe('OpenShortcutsPage', () => {
  const userAgent = navigator.userAgent;

  const setUserAgent = (value: string) =>
    Object.defineProperty(navigator, 'userAgent', {
      value,
      configurable: true,
    });

  afterEach(() => setUserAgent(userAgent));

  it('has Firefox open its page for the extension', () => {
    const openShortcutSettings = jest.fn();
    global.chrome = {
      commands: { openShortcutSettings },
      tabs: { create: jest.fn() },
    } as unknown as typeof chrome;

    OpenShortcutsPage();

    expect(openShortcutSettings).toBeCalled();
    expect(chrome.tabs.create).not.toBeCalled();
  });

  it('opens the extension shortcuts page by URL in Chrome and Edge', () => {
    global.chrome = {
      commands: {},
      tabs: { create: jest.fn() },
    } as unknown as typeof chrome;

    setUserAgent('Mozilla/5.0 Chrome/154.0.0.0 Safari/537.36');
    OpenShortcutsPage();
    setUserAgent('Mozilla/5.0 Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0');
    OpenShortcutsPage();

    expect(chrome.tabs.create).toBeCalledWith({
      url: 'chrome://extensions/shortcuts',
    });
    expect(chrome.tabs.create).toBeCalledWith({
      url: 'edge://extensions/shortcuts',
    });
  });
});
