import { getInstallId } from './install-id';

const INSTALL_ID = /^[0-9a-f-]{36}$/;

/**
 * An in-memory storage area kept in store; set rejects when failSet is true.
 */
const area = (store: Record<string, unknown>, failSet = false) => ({
  get: jest.fn(async (key: string) => ({ [key]: store[key] })),
  set: jest.fn(async (items: Record<string, unknown>) => {
    if (failSet) {
      throw new Error('QUOTA_BYTES_PER_ITEM quota exceeded');
    }

    Object.assign(store, items);
  }),
});

let local: Record<string, unknown>;
let sync: Record<string, unknown>;

/**
 * Sets up chrome.storage with local, and sync unless it's left out.
 */
const mockStorage = ({ withSync = true, failSyncSet = false } = {}) => {
  global.chrome = {
    storage: {
      local: area(local),
      ...(withSync && { sync: area(sync, failSyncSet) }),
    },
  } as unknown as typeof chrome;
};

beforeEach(() => {
  local = {};
  sync = {};
});

describe('getInstallId', () => {
  it('makes an install id once and keeps it in sync storage', async () => {
    mockStorage();

    const installId = await getInstallId();

    expect(installId).toMatch(INSTALL_ID);
    expect(sync['gallery-install-id']).toBe(installId);
    expect(local['gallery-install-id']).toBeUndefined();
    expect(await getInstallId()).toBe(installId);
  });

  it('uses the id sync storage already has', async () => {
    sync['gallery-install-id'] = 'synced-id';
    local['gallery-install-id'] = 'local-id';
    mockStorage();

    expect(await getInstallId()).toBe('synced-id');
  });

  it('moves an id kept in local storage into sync storage', async () => {
    local['gallery-install-id'] = 'local-id';
    mockStorage();

    expect(await getInstallId()).toBe('local-id');
    expect(sync['gallery-install-id']).toBe('local-id');
  });

  it('keeps the id in local storage when sync storage is missing', async () => {
    mockStorage({ withSync: false });

    const installId = await getInstallId();

    expect(installId).toMatch(INSTALL_ID);
    expect(local['gallery-install-id']).toBe(installId);
    expect(await getInstallId()).toBe(installId);
  });

  it('keeps the id in local storage when saving to sync fails', async () => {
    mockStorage({ failSyncSet: true });

    const installId = await getInstallId();

    expect(installId).toMatch(INSTALL_ID);
    expect(local['gallery-install-id']).toBe(installId);
    expect(await getInstallId()).toBe(installId);
  });

  it('still returns an id when reading sync storage fails', async () => {
    local['gallery-install-id'] = 'local-id';
    mockStorage();
    (chrome.storage.sync.get as jest.Mock).mockRejectedValue(
      new Error('sync is disabled')
    );

    expect(await getInstallId()).toBe('local-id');
  });
});
