import { mount } from '@vue/test-utils';

import SyncStylebot from './SyncStylebot.vue';
import { openSyncOptions } from '../utils';
import {
  getLastSyncedAt,
  getSyncError,
  getSyncNeedsAuth,
} from '@stylebot/sync';
import type { RunGoogleDriveSyncResponse } from '@stylebot/types';

jest.mock('../utils', () => ({
  openSyncOptions: jest.fn(),
}));

jest.mock('@stylebot/sync', () => ({
  formatSyncTime: (value?: string) => (value ? `at ${value}` : ''),
  getLastSyncedAt: jest.fn(),
  getSyncError: jest.fn(),
  getSyncNeedsAuth: jest.fn(),
}));

const flush = () => new Promise(resolve => setTimeout(resolve));

let respond: (response?: RunGoogleDriveSyncResponse) => void;
const sendMessage = jest.fn((_message, callback) => {
  respond = callback;
});

const metadata = {
  id: 'file-id',
  modifiedTime: '2026-01-12T08:00:00Z',
  webViewLink: 'https://drive.google.com/view',
  webContentLink: 'https://drive.google.com/download',
};

const syncState = (
  lastSyncedAt?: string,
  needsAuth = false,
  errorKey: string | null = null
) => {
  (getLastSyncedAt as jest.Mock).mockResolvedValue(lastSyncedAt);
  (getSyncNeedsAuth as jest.Mock).mockResolvedValue(needsAuth);
  (getSyncError as jest.Mock).mockResolvedValue(errorKey);
};

/**
 * Opens the strip with the given sync state, which starts a sync unless it
 * needs a sign-in.
 */
const openStrip = async (
  lastSyncedAt?: string,
  needsAuth = false,
  errorKey: string | null = null
) => {
  syncState(lastSyncedAt, needsAuth, errorKey);
  const wrapper = mount(SyncStylebot);
  await flush();
  return wrapper;
};

describe('SyncStylebot.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.chrome = {
      runtime: { sendMessage, lastError: undefined },
    } as unknown as typeof chrome;
  });

  it('syncs without an auth window as soon as it opens', async () => {
    await openStrip('earlier');

    expect(sendMessage).toHaveBeenCalledWith(
      { name: 'RunGoogleDriveSync', interactive: false },
      expect.any(Function)
    );
  });

  it('keeps the last sync time on screen while it syncs', async () => {
    const wrapper = await openStrip('earlier');

    expect(wrapper.text()).toContain('synced_at_time');
    expect(wrapper.find('.sync-button').attributes('disabled')).toBeDefined();
  });

  it('says it is syncing when it never has', async () => {
    const wrapper = await openStrip(undefined);

    expect(wrapper.text()).toContain('sync_in_progress');
  });

  it('reports success and tells the popup', async () => {
    const wrapper = await openStrip('earlier');

    syncState('now');
    respond({ ok: true, metadata });
    await flush();

    expect(wrapper.find('.sync-button').attributes('disabled')).toBeUndefined();
    expect(wrapper.emitted('synced')).toHaveLength(1);
  });

  it('shows a failure and lets the user retry', async () => {
    const wrapper = await openStrip('earlier');

    syncState('earlier', false, 'sync_error_network');
    respond({ ok: false, errorKey: 'sync_error_network' });
    await flush();

    expect(wrapper.text()).toContain('couldnt_reach_google_drive');
    expect(wrapper.text()).toContain('retry');
    expect(wrapper.emitted('synced')).toBeUndefined();

    await wrapper.find('.sync-button').trigger('click');

    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  it('treats a background that never answered as a failure', async () => {
    const wrapper = await openStrip('earlier');

    respond(undefined);
    await flush();

    expect(wrapper.text()).toContain('couldnt_sync');
  });

  it('keeps showing a failure from a closed popup while it tries again', async () => {
    const wrapper = await openStrip('earlier', false, 'sync_error_network');

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('couldnt_reach_google_drive');

    syncState('now');
    respond({ ok: true, metadata });
    await flush();

    expect(wrapper.text()).not.toContain('couldnt_reach_google_drive');
    expect(wrapper.text()).toContain('synced_at_time');
  });

  it('points to the Sync tab when a sign-in is needed, without syncing', async () => {
    const wrapper = await openStrip('earlier', true);

    expect(sendMessage).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('sign_in_to_keep_syncing');

    await wrapper.find('.sync-button').trigger('click');

    expect(openSyncOptions).toHaveBeenCalled();
  });

  it('switches to the sign-in prompt when a sync finds it needs one', async () => {
    const wrapper = await openStrip('earlier');

    syncState('earlier', true);
    respond({ ok: false, errorKey: 'sync_error_auth' });
    await flush();

    expect(wrapper.text()).toContain('sign_in_to_keep_syncing');
  });
});
