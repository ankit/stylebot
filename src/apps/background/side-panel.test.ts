import { getChromiumVariant, detectChromiumVariant } from '@stylebot/utils';
import {
  isEditorSidePanelOpen,
  hasSidePanelPermission,
  isSidePanelAwaitingReload,
  isSidePanelGranted,
  openEditorSidePanel,
  removeSidePanelPermission,
  requestSidePanelPermission,
} from '@stylebot/side-panel';

import { reloadForGrant, resumeAfterGrantReload } from './grant-reload';
import { get as getOption, set as setOption } from './options';
import {
  initSidePanel,
  onEditorSidePanelOpened,
  openEditorSidePanelWithFallback,
  opensEditorInSidePanel,
  reloadForSidePanelGrant,
} from './side-panel';

jest.mock('@stylebot/utils', () => ({
  ...jest.requireActual('@stylebot/utils'),
  getChromiumVariant: jest.fn(),
  detectChromiumVariant: jest.fn(),
}));
jest.mock('@stylebot/side-panel', () => ({
  ...jest.requireActual('@stylebot/side-panel'),
  isEditorSidePanelOpen: jest.fn(),
  supportsEditorSidePanel: () => true,
  isSidePanelGranted: jest.fn(),
  isSidePanelAwaitingReload: jest.fn(),
  openEditorSidePanel: jest.fn(),
  requestSidePanelPermission: jest.fn(),
  removeSidePanelPermission: jest.fn(),
  hasSidePanelPermission: jest.fn(),
}));
jest.mock('./grant-reload', () => ({
  reloadForGrant: jest.fn(),
  resumeAfterGrantReload: jest.fn(),
}));
jest.mock('./options', () => ({
  get: jest.fn(),
  set: jest.fn(() => Promise.resolve()),
  waitForPendingWrites: jest.fn(() => Promise.resolve()),
}));

const layout = {
  width: 360,
  adjustPageLayout: false,
  dockLocation: 'sidepanel',
};

const openStylebot = () =>
  expect(chrome.tabs.sendMessage).toBeCalledWith(
    7,
    { name: 'OpenStylebot' },
    expect.any(Function)
  );

const check = async () => {
  const done = onEditorSidePanelOpened(7);
  await jest.advanceTimersByTimeAsync(3000);
  await done;
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  (getOption as jest.Mock).mockResolvedValue(layout);
  (isEditorSidePanelOpen as jest.Mock).mockResolvedValue(false);
  (getChromiumVariant as jest.Mock).mockResolvedValue(undefined);
  (detectChromiumVariant as jest.Mock).mockResolvedValue(undefined);
  (resumeAfterGrantReload as jest.Mock).mockResolvedValue(false);
  (removeSidePanelPermission as jest.Mock).mockResolvedValue(true);
  global.chrome = {
    tabs: { sendMessage: jest.fn() },
    runtime: {},
  } as unknown as typeof chrome;
});

afterEach(() => jest.useRealTimers());

describe('onEditorSidePanelOpened', () => {
  it('leaves the side panel alone once it shows the editor', async () => {
    (isEditorSidePanelOpen as jest.Mock)
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);

    await check();

    expect(setOption).not.toBeCalled();
    expect(chrome.tabs.sendMessage).not.toBeCalled();
  });

  it('leaves the side panel alone when it reports nothing in time', async () => {
    await check();

    expect(setOption).not.toBeCalled();
    expect(chrome.tabs.sendMessage).not.toBeCalled();
  });

  it('docks the editor in the page once the panel reports it is hosted as a tab', async () => {
    (getChromiumVariant as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue('vivaldi');

    await check();

    expect(setOption).toBeCalledWith('layout', {
      ...layout,
      dockLocation: 'right',
    });
    openStylebot();
  });

  it('opens the editor in the page at once when the browser is already known', async () => {
    (getChromiumVariant as jest.Mock).mockResolvedValue('arc');
    (getOption as jest.Mock).mockResolvedValue({
      ...layout,
      dockLocation: 'right',
    });

    await onEditorSidePanelOpened(7);

    expect(isEditorSidePanelOpen).not.toBeCalled();
    expect(setOption).not.toBeCalled();
    openStylebot();
  });
});

describe('opensEditorInSidePanel', () => {
  let onChanged: (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string
  ) => void;

  beforeEach(() => {
    global.chrome = {
      sidePanel: { open: jest.fn() },
      permissions: { onAdded: { addListener: jest.fn() } },
      storage: {
        onChanged: {
          addListener: jest.fn(listener => {
            onChanged = listener;
          }),
        },
      },
    } as unknown as typeof chrome;
  });

  it('tries the side panel until the dock is read', () => {
    jest.isolateModules(() => {
      const check = jest.requireActual('./side-panel');
      expect(check.opensEditorInSidePanel()).toBe(true);
    });
  });

  it('follows the dock as it changes', async () => {
    initSidePanel();
    await jest.runAllTimersAsync();
    expect(opensEditorInSidePanel()).toBe(true);

    onChanged(
      {
        options: { newValue: { layout: { ...layout, dockLocation: 'right' } } },
      },
      'local'
    );
    expect(opensEditorInSidePanel()).toBe(false);
  });

  it('stays in the page once the browser is found not to show it', async () => {
    initSidePanel();
    await jest.runAllTimersAsync();

    onChanged({ chromiumVariant: { newValue: 'arc' } }, 'local');
    expect(opensEditorInSidePanel()).toBe(false);
  });
});

describe('the sidePanel permission', () => {
  let onChanged: (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string
  ) => void;

  beforeEach(async () => {
    (isSidePanelGranted as jest.Mock).mockReturnValue(false);
    (isSidePanelAwaitingReload as jest.Mock).mockReturnValue(false);
    (requestSidePanelPermission as jest.Mock).mockResolvedValue(true);
    global.chrome = {
      permissions: { onAdded: { addListener: jest.fn() } },
      storage: {
        onChanged: {
          addListener: jest.fn(listener => {
            onChanged = listener;
          }),
        },
      },
    } as unknown as typeof chrome;

    initSidePanel();
    await jest.runAllTimersAsync();
  });

  it('is asked for, then Stylebot reloads to open the editor in the page', async () => {
    await openEditorSidePanelWithFallback(7);

    expect(requestSidePanelPermission).toBeCalled();
    expect(openEditorSidePanel).not.toBeCalled();
    expect(reloadForGrant).toBeCalledWith('side-panel-reloaded-for-grant', {
      open: { 7: 'page' },
    });
  });

  it('is asked for before anything is awaited, during the gesture', () => {
    openEditorSidePanelWithFallback(7).catch(() => undefined);

    expect(requestSidePanelPermission).toBeCalled();
  });

  it('reloads Stylebot without asking again once granted', async () => {
    (isSidePanelAwaitingReload as jest.Mock).mockReturnValue(true);

    await openEditorSidePanelWithFallback(7);

    expect(requestSidePanelPermission).not.toBeCalled();
    expect(reloadForGrant).toBeCalled();
  });

  it('leaves the editor to the page when refused', async () => {
    (requestSidePanelPermission as jest.Mock).mockResolvedValue(false);

    await expect(openEditorSidePanelWithFallback(7)).rejects.toThrow();
    expect(reloadForGrant).not.toBeCalled();
  });

  it('is given back without a reload in a browser that won’t show the panel', async () => {
    (detectChromiumVariant as jest.Mock).mockResolvedValue('vivaldi');

    await expect(openEditorSidePanelWithFallback(7)).rejects.toThrow();
    expect(removeSidePanelPermission).toBeCalled();
    expect(reloadForGrant).not.toBeCalled();
  });

  it('doesn’t reload Stylebot twice for it', async () => {
    (resumeAfterGrantReload as jest.Mock).mockResolvedValue(true);
    initSidePanel();

    await expect(openEditorSidePanelWithFallback(7)).rejects.toThrow();
    expect(reloadForGrant).not.toBeCalled();
  });

  it('opens the side panel at once while held since the start', async () => {
    (isSidePanelGranted as jest.Mock).mockReturnValue(true);
    (openEditorSidePanel as jest.Mock).mockResolvedValue(undefined);

    openEditorSidePanelWithFallback(7);

    expect(openEditorSidePanel).toBeCalledWith(7);
    expect(requestSidePanelPermission).not.toBeCalled();
  });

  it('is kept in Chrome', () => {
    expect(removeSidePanelPermission).not.toBeCalled();
  });

  it('is given back once Stylebot finds itself in Vivaldi or Arc', () => {
    onChanged({ chromiumVariant: { newValue: 'vivaldi' } }, 'local');

    expect(removeSidePanelPermission).toBeCalled();
  });

  it('is given back at start in a browser already known not to show it', async () => {
    (getChromiumVariant as jest.Mock).mockResolvedValue('vivaldi');

    initSidePanel();
    await jest.runAllTimersAsync();

    expect(removeSidePanelPermission).toBeCalled();
  });
});

describe('reloadForSidePanelGrant', () => {
  beforeEach(() => {
    (hasSidePanelPermission as jest.Mock).mockResolvedValue(true);
    (isSidePanelGranted as jest.Mock).mockReturnValue(false);
  });

  it('reloads Stylebot and shows Options again', async () => {
    await reloadForSidePanelGrant();

    expect(reloadForGrant).toBeCalledWith('side-panel-reloaded-for-grant', {
      optionsRoute: '/basics',
    });
  });

  it('doesn’t reload without the permission', async () => {
    (hasSidePanelPermission as jest.Mock).mockResolvedValue(false);

    await reloadForSidePanelGrant();

    expect(reloadForGrant).not.toBeCalled();
  });

  it('doesn’t reload when the permission came with the start', async () => {
    (isSidePanelGranted as jest.Mock).mockReturnValue(true);

    await reloadForSidePanelGrant();

    expect(reloadForGrant).not.toBeCalled();
  });
});
