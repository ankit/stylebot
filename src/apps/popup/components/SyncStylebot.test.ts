import type Vue from 'vue';
import type { Wrapper } from '@vue/test-utils';
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
 * Opens the strip with the given sync state.
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

/**
 * Clicks the strip's button, which syncs unless a sign-in is needed.
 */
const clickSync = async (wrapper: Wrapper<Vue>) => {
  await wrapper.find('.sync-button').trigger('click');
};

describe('SyncStylebot.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.chrome = {
      runtime: { sendMessage, lastError: undefined },
    } as unknown as typeof chrome;
  });

  it('shows when it last synced without syncing on open', async () => {
    const wrapper = await openStrip('earlier');

    expect(sendMessage).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('synced_at_time');
    expect(wrapper.text()).toContain('sync_now');
  });

  it('syncs without an auth window when Sync now is clicked', async () => {
    const wrapper = await openStrip('earlier');

    await clickSync(wrapper);

    expect(sendMessage).toHaveBeenCalledWith(
      { name: 'RunGoogleDriveSync', interactive: false },
      expect.any(Function)
    );
    expect(wrapper.find('.sync-button').attributes('disabled')).toBeDefined();
  });

  it('says it is syncing when it never has', async () => {
    const wrapper = await openStrip(undefined);

    await clickSync(wrapper);

    expect(wrapper.text()).toContain('sync_in_progress');
  });

  it('reports success and tells the popup', async () => {
    const wrapper = await openStrip('earlier');
    await clickSync(wrapper);

    syncState('now');
    respond({ ok: true, metadata });
    await flush();

    expect(wrapper.find('.sync-button').attributes('disabled')).toBeUndefined();
    expect(wrapper.emitted('synced')).toHaveLength(1);
  });

  it('shows a failure and lets the user retry', async () => {
    const wrapper = await openStrip('earlier');
    await clickSync(wrapper);

    syncState('earlier', false, 'sync_error_network');
    respond({ ok: false, errorKey: 'sync_error_network' });
    await flush();

    expect(wrapper.text()).toContain('couldnt_reach_google_drive');
    expect(wrapper.text()).toContain('retry');
    expect(wrapper.emitted('synced')).toBeUndefined();

    await clickSync(wrapper);

    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  it('treats a background that never answered as a failure', async () => {
    const wrapper = await openStrip('earlier');
    await clickSync(wrapper);

    respond(undefined);
    await flush();

    expect(wrapper.text()).toContain('couldnt_sync');
  });

  it('keeps showing an earlier failure until a retry replaces it', async () => {
    const wrapper = await openStrip('earlier', false, 'sync_error_network');

    expect(wrapper.text()).toContain('couldnt_reach_google_drive');

    await clickSync(wrapper);
    expect(wrapper.text()).toContain('couldnt_reach_google_drive');

    syncState('now');
    respond({ ok: true, metadata });
    await flush();

    expect(wrapper.text()).not.toContain('couldnt_reach_google_drive');
    expect(wrapper.text()).toContain('synced_at_time');
  });

  it('points to the Sync tab when a sign-in is needed', async () => {
    const wrapper = await openStrip('earlier', true);

    expect(wrapper.text()).toContain('sign_in_to_keep_syncing');

    await clickSync(wrapper);

    expect(sendMessage).not.toHaveBeenCalled();
    expect(openSyncOptions).toHaveBeenCalled();
  });

  it('switches to the sign-in prompt when a sync finds it needs one', async () => {
    const wrapper = await openStrip('earlier');
    await clickSync(wrapper);

    syncState('earlier', true);
    respond({ ok: false, errorKey: 'sync_error_auth' });
    await flush();

    expect(wrapper.text()).toContain('sign_in_to_keep_syncing');
  });
});
