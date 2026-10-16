import type * as Permission from './permission';

/**
 * Loads a fresh copy, as a new extension context starts with.
 */
const loadModule = (): typeof Permission => {
  let loaded: typeof Permission | undefined;

  jest.isolateModules(() => {
    loaded = jest.requireActual<typeof Permission>('./permission');
  });

  return loaded!;
};

const makeChrome = ({
  sidePanel = false,
  optional = ['sidePanel'],
  grant = true,
} = {}) => {
  const api = {
    runtime: {
      getManifest: () => ({ optional_permissions: optional }),
      lastError: undefined,
    },
    permissions: {
      request: jest.fn((_, callback) => callback(grant)),
      remove: jest.fn((_, callback) => callback(true)),
    },
    sidePanel: sidePanel ? { open: jest.fn() } : undefined,
  };

  global.chrome = api as unknown as typeof chrome;
  return api;
};

describe('isSidePanelGranted', () => {
  it('says yes where the side panel came with the start', () => {
    makeChrome({ sidePanel: true });

    expect(loadModule().isSidePanelGranted()).toBe(true);
  });

  it('says no without the permission', () => {
    makeChrome();

    expect(loadModule().isSidePanelGranted()).toBe(false);
  });

  it('says no after a grant while running, until Stylebot reloads', async () => {
    const api = makeChrome();
    const sidePanel = loadModule();

    await expect(sidePanel.requestSidePanelPermission()).resolves.toBe(true);
    api.sidePanel = { open: jest.fn() };

    expect(api.permissions.request).toBeCalledWith(
      { permissions: ['sidePanel'] },
      expect.any(Function)
    );
    expect(sidePanel.isSidePanelGranted()).toBe(false);
    expect(sidePanel.isSidePanelAwaitingReload()).toBe(true);
  });

  it('says no after a grant another page made', () => {
    makeChrome({ sidePanel: true });
    const sidePanel = loadModule();

    sidePanel.markSidePanelAwaitingReload({ permissions: ['nativeMessaging'] });
    expect(sidePanel.isSidePanelGranted()).toBe(true);

    sidePanel.markSidePanelAwaitingReload({ permissions: ['sidePanel'] });
    expect(sidePanel.isSidePanelGranted()).toBe(false);
  });

  it('awaits no reload when the grant is refused', async () => {
    makeChrome({ grant: false });
    const sidePanel = loadModule();

    await expect(sidePanel.requestSidePanelPermission()).resolves.toBe(false);
    expect(sidePanel.isSidePanelAwaitingReload()).toBe(false);
  });
});

describe('removeSidePanelPermission', () => {
  it('gives back the sidePanel permission', async () => {
    const api = makeChrome({ sidePanel: true });

    await loadModule().removeSidePanelPermission();

    expect(api.permissions.remove).toBeCalledWith(
      { permissions: ['sidePanel'] },
      expect.any(Function)
    );
  });
});
