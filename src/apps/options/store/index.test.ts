jest.mock('@stylebot/sync', () => ({
  getGoogleDriveSyncEnabled: jest.fn(),
  getSyncState: jest.fn(),
  getSyncNeedsAuth: jest.fn().mockResolvedValue(false),
  setGoogleDriveSyncEnabled: jest.fn(),
  clearSyncState: jest.fn(),
  dismissSyncConflict: jest.fn(),
}));

jest.mock('../utils', () => ({
  getAllStyles: jest.fn().mockResolvedValue({}),
  runGoogleDriveSync: jest.fn(),
}));

import type { SyncState } from '@stylebot/types';
import {
  getGoogleDriveSyncEnabled,
  getSyncState,
  setGoogleDriveSyncEnabled,
} from '@stylebot/sync';

import { runGoogleDriveSync } from '../utils';
import { createStore } from '.';

/**
 * Stands in for chrome.storage: the enabled flag reads back what was last set.
 */
const storeEnabledFlag = () => {
  let enabled = false;
  jest
    .mocked(setGoogleDriveSyncEnabled)
    .mockImplementation(value => (enabled = value));
  jest
    .mocked(getGoogleDriveSyncEnabled)
    .mockImplementation(async () => enabled);
};

describe('connecting Google Drive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeEnabledFlag();
  });

  it('stays connected once the first sync goes through', async () => {
    jest.mocked(runGoogleDriveSync).mockResolvedValue({
      ok: true,
      metadata: {} as never,
    });
    jest
      .mocked(getSyncState)
      .mockResolvedValue({ lastSyncedAt: 'now' } as SyncState);

    const store = createStore();
    await store.dispatch('setGoogleDriveSyncEnabled', true);

    expect(store.state.googleDriveSyncEnabled).toBe(true);
    expect(store.state.syncStatus).toBeNull();
  });

  it('goes back to disconnected when the first sync fails, keeping the error', async () => {
    jest.mocked(runGoogleDriveSync).mockResolvedValue({
      ok: false,
      errorKey: 'sync_error_auth',
    });
    jest.mocked(getSyncState).mockResolvedValue(undefined);

    const store = createStore();
    await store.dispatch('setGoogleDriveSyncEnabled', true);

    expect(store.state.googleDriveSyncEnabled).toBe(false);
    expect(setGoogleDriveSyncEnabled).toHaveBeenLastCalledWith(false);
    expect(store.state.syncStatus).toEqual(
      expect.objectContaining({ type: 'error', messageKey: 'sync_error_auth' })
    );
  });
});
