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
jest.mock('./restore-tabs', () => ({ restoreOpenTabs: jest.fn() }));
jest.mock('./chat', () => ({ initChatPort: jest.fn() }));
jest.mock('./styles', () => ({
  refreshAllBadges: jest.fn(),
  refreshBadgeForTab: jest.fn(),
}));
jest.mock('./options', () => ({ get: jest.fn(), pruneRetired: jest.fn() }));
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

import { initListeners } from './listeners';
import { pruneRetired } from './options';
import { restoreOpenTabs } from './restore-tabs';

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
