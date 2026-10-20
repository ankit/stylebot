jest.mock('./contextmenu', () => ({
  ContextMenu: { update: jest.fn() },
  handleContextMenuClick: jest.fn(),
}));
jest.mock('./global-commands', () => ({ handleCommand: jest.fn() }));
jest.mock('./side-panel-tabs', () => ({
  configureSidePanelTabs: jest.fn(),
  initSidePanelTabs: jest.fn(),
}));
jest.mock('./editor-window', () => ({
  close: jest.fn(),
  forgetWindow: jest.fn(),
}));
jest.mock('./messages', () => ({}));
jest.mock('./gallery-preview', () => ({
  endGalleryPreview: jest.fn(),
  endGalleryPreviewOffSite: jest.fn(),
  syncGalleryPreviewSites: jest.fn(),
}));
jest.mock('./restore-tabs', () => ({
  restoreOpenTabs: jest.fn(),
  restoreTab: jest.fn(async () => undefined),
}));
jest.mock('./badge', () => ({ updateBadge: jest.fn() }));
jest.mock('./options', () => ({ get: jest.fn(), pruneRetired: jest.fn() }));
jest.mock('./side-panel', () => ({
  initSidePanel: jest.fn(),
  onEditorSidePanelOpened: jest.fn(),
}));
jest.mock('./sync-scheduler', () => ({
  AWAY_SECONDS: 60,
  isSyncAlarm: jest.fn(),
  updatePeriodicSync: jest.fn(),
}));
jest.mock('@stylebot/sync', () => ({
  runGoogleDriveSync: jest.fn(),
  getGoogleDriveSyncEnabled: jest.fn(),
  SYNC_ISSUE_KEYS: [],
}));
jest.mock('@stylebot/google-auth', () => ({
  isSignInRedirect: () => false,
}));

import { ContextMenu } from './contextmenu';
import { initListeners } from './listeners';
import { get as getOption, pruneRetired } from './options';
import { restoreOpenTabs, restoreTab } from './restore-tabs';

type InstalledDetails = { reason: string; previousVersion?: string };
type OnInstalled = (details: InstalledDetails) => Promise<void>;

/**
 * Stands in for Chrome at the given extension version, keeping the
 * onInstalled listener so a test can fire it.
 */
const makeChrome = (version: string) => {
  let onInstalled: OnInstalled | undefined;
  const event = () => ({ addListener: jest.fn() });

  const api = {
    runtime: {
      getManifest: () => ({ version }),
      onInstalled: {
        addListener: (fn: OnInstalled) => {
          onInstalled = fn;
        },
      },
      onStartup: event(),
      onMessage: event(),
    },
    tabs: {
      create: jest.fn(),
      get: jest.fn(),
      sendMessage: jest.fn(),
      onRemoved: event(),
      onUpdated: event(),
      onActivated: event(),
    },
    windows: { onRemoved: event() },
    commands: { onCommand: event() },
    alarms: { onAlarm: event() },
    idle: undefined,
    storage: {
      local: {
        get: jest.fn(async () => ({})),
        set: jest.fn(async () => undefined),
      },
      onChanged: event(),
    },
    contextMenus: { onClicked: event() },
    i18n: { getMessage: () => 'en' },
  };

  global.chrome = api as unknown as typeof chrome;
  initListeners();

  return {
    api,
    fireInstalled: (details: InstalledDetails) => onInstalled?.(details),
  };
};

describe('onInstalled', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens the release page in the background after a major update', async () => {
    const { api, fireInstalled } = makeChrome('4.0.0');

    await fireInstalled({ reason: 'update', previousVersion: '3.2.4' });

    expect(pruneRetired).toBeCalled();
    expect(api.tabs.create).toBeCalledWith({
      url: 'https://stylebot.dev/releases/4.0',
      active: false,
    });
    expect(api.storage.local.set).toBeCalledWith({
      'notification~release/4.0': true,
    });
  });

  it('puts Stylebot back into open tabs before the release page opens', async () => {
    const { api, fireInstalled } = makeChrome('4.0.0');

    await fireInstalled({ reason: 'update', previousVersion: '3.2.4' });

    expect(restoreOpenTabs).toBeCalledWith();
    expect(
      (restoreOpenTabs as jest.Mock).mock.invocationCallOrder[0]
    ).toBeLessThan(api.tabs.create.mock.invocationCallOrder[0]);
  });

  it.each([
    ['a patch', '4.0.0', '4.0.1'],
    ['a minor', '4.0.0', '4.1.0'],
  ])(
    'leaves the release page and banner alone after %s update',
    async (_, previousVersion, version) => {
      const { api, fireInstalled } = makeChrome(version);

      await fireInstalled({ reason: 'update', previousVersion });

      expect(pruneRetired).toBeCalled();
      expect(api.tabs.create).not.toBeCalled();
      expect(api.storage.local.set).not.toBeCalledWith({
        'notification~release/4.0': true,
      });
    }
  );

  it('opens nothing when the previous version is unknown', async () => {
    const { api, fireInstalled } = makeChrome('4.0.0');

    await fireInstalled({ reason: 'update' });

    expect(api.tabs.create).not.toBeCalled();
  });

  it('opens the welcome page, not the release page, on install', async () => {
    const { api, fireInstalled } = makeChrome('4.0.0');

    await fireInstalled({ reason: 'install' });

    expect(api.tabs.create).toBeCalledTimes(1);
    expect(api.tabs.create).toBeCalledWith({
      url: 'https://stylebot.dev/welcome',
    });
    expect(restoreOpenTabs).not.toBeCalled();
  });
});

describe('onActivated', () => {
  it('restores a tab left for later when it is first shown', async () => {
    const { api } = makeChrome('4.0.0');
    const [[onActivated]] = api.tabs.onActivated.addListener.mock.calls;

    await onActivated({ tabId: 5, windowId: 1 });

    expect(restoreTab).toBeCalledWith(5);
  });

  it('refreshes the context menu only for a tab still showing once restored', async () => {
    const { api } = makeChrome('4.0.0');
    const [[onActivated]] = api.tabs.onActivated.addListener.mock.calls;
    (getOption as jest.Mock).mockResolvedValue(true);

    api.tabs.get.mockResolvedValueOnce({ id: 5, active: false });
    await onActivated({ tabId: 5, windowId: 1 });
    expect(ContextMenu.update).not.toBeCalled();

    api.tabs.get.mockResolvedValueOnce({ id: 6, active: true });
    await onActivated({ tabId: 6, windowId: 1 });
    expect(ContextMenu.update).toBeCalledWith({ id: 6, active: true });
  });
});

type OnUpdated = (
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: Partial<chrome.tabs.Tab>
) => Promise<void>;

describe('onUpdated', () => {
  const loadedTab = {
    id: 1,
    url: 'https://example.com/',
    status: 'complete',
    active: true,
  };

  /**
   * Fires the tab update listener that refreshes the context menu and tells
   * the page, with the contextMenu option on.
   */
  const fireUpdated = async (
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: Partial<chrome.tabs.Tab> = loadedTab
  ) => {
    const { api } = makeChrome('4.0.0');
    const listeners = api.tabs.onUpdated.addListener.mock.calls.map(
      ([listener]) => listener as OnUpdated
    );

    await Promise.all(listeners.map(listener => listener(1, changeInfo, tab)));

    return api;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getOption as jest.Mock).mockResolvedValue(true);
  });

  it('refreshes the menu and tells the page when a load completes', async () => {
    const api = await fireUpdated({ status: 'complete' });

    expect(ContextMenu.update).toBeCalledWith(loadedTab);
    expect(api.tabs.sendMessage).toBeCalledWith(1, { name: 'TabUpdated' });
  });

  it('tells the page about a URL change on a loaded tab', async () => {
    const api = await fireUpdated({ url: 'https://example.com/next' });

    expect(api.tabs.sendMessage).toBeCalledWith(1, { name: 'TabUpdated' });
  });

  it.each([
    ['title', { title: 'Inbox (3)' }],
    ['favicon', { favIconUrl: 'https://example.com/unread.ico' }],
    ['audible', { audible: true }],
  ])('does nothing on a %s change to a loaded tab', async (_, changeInfo) => {
    const api = await fireUpdated(changeInfo);

    expect(getOption).not.toBeCalled();
    expect(ContextMenu.update).not.toBeCalled();
    expect(api.tabs.sendMessage).not.toBeCalled();
  });

  it('waits for a navigation that is still loading', async () => {
    const api = await fireUpdated(
      { url: 'https://example.com/next', status: 'loading' },
      { ...loadedTab, status: 'loading' }
    );

    expect(ContextMenu.update).not.toBeCalled();
    expect(api.tabs.sendMessage).not.toBeCalled();
  });

  it('tells a background tab without refreshing the menu', async () => {
    const api = await fireUpdated(
      { status: 'complete' },
      { ...loadedTab, active: false }
    );

    expect(ContextMenu.update).not.toBeCalled();
    expect(api.tabs.sendMessage).toBeCalledWith(1, { name: 'TabUpdated' });
  });
});
