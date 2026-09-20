import { mount } from '@vue/test-utils';

import SyncStylebot from './SyncStylebot.vue';
import {
  getLastSyncedAt,
  getSyncNeedsAuth,
} from '../../sync/google-drive/sync-metadata';

jest.mock('../../sync/google-drive/sync-metadata', () => ({
  getLastSyncedAt: jest.fn(),
  getSyncNeedsAuth: jest.fn(),
}));

const flush = () => new Promise(resolve => setTimeout(resolve));

const mountStrip = async ({
  lastSyncedAt,
  needsAuth = false,
}: {
  lastSyncedAt?: string;
  needsAuth?: boolean;
}) => {
  (getLastSyncedAt as jest.Mock).mockResolvedValue(lastSyncedAt);
  (getSyncNeedsAuth as jest.Mock).mockResolvedValue(needsAuth);

  const wrapper = mount(SyncStylebot);
  await flush();

  return wrapper;
};

describe('SyncStylebot.vue', () => {
  beforeEach(() => {
    global.chrome = {
      runtime: { sendMessage: jest.fn(), lastError: undefined },
    } as unknown as typeof chrome;
  });

  it('shows when the last sync happened with a status dot', async () => {
    const wrapper = await mountStrip({
      lastSyncedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    });

    expect(wrapper.find('.dot').exists()).toBe(true);
    expect(wrapper.text()).toContain('synced_at_time');
    expect(wrapper.find('.sync-button').text()).toBe('sync_action');
  });

  it('says so when nothing has synced yet', async () => {
    const wrapper = await mountStrip({});

    expect(wrapper.text()).toContain('sync_never');
  });

  it('asks for a sign-in instead of a timestamp when a scheduled sync could not auth', async () => {
    const wrapper = await mountStrip({
      lastSyncedAt: new Date().toISOString(),
      needsAuth: true,
    });

    expect(wrapper.text()).toContain('sync_needs_sign_in');
    expect(wrapper.text()).not.toContain('synced_at_time');
    expect(wrapper.classes()).toContain('error');
  });

  it('disables the button and shows progress while a sync runs', async () => {
    const wrapper = await mountStrip({
      lastSyncedAt: new Date().toISOString(),
    });

    await wrapper.find('.sync-button').trigger('click');

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { name: 'RunGoogleDriveSync' },
      expect.any(Function)
    );
    expect(wrapper.find('.sync-button').attributes('disabled')).toBe(
      'disabled'
    );
    expect(wrapper.text()).toContain('sync_in_progress');
    expect(wrapper.find('.dot').exists()).toBe(false);
  });

  it('shows the error and re-enables the button when the sync fails', async () => {
    const wrapper = await mountStrip({
      lastSyncedAt: new Date().toISOString(),
    });

    await wrapper.find('.sync-button').trigger('click');

    const respond = (chrome.runtime.sendMessage as jest.Mock).mock.calls[0][1];
    respond({ ok: false, errorKey: 'sync_error_auth', errorDetail: '' });
    await flush();

    expect(wrapper.text()).toContain('sync_error_auth');
    expect(wrapper.classes()).toContain('error');
    expect(wrapper.find('.sync-button').attributes('disabled')).toBeUndefined();
  });

  it('refreshes the timestamp after a successful sync', async () => {
    const wrapper = await mountStrip({});

    expect(wrapper.text()).toContain('sync_never');

    await wrapper.find('.sync-button').trigger('click');
    (getLastSyncedAt as jest.Mock).mockResolvedValue(new Date().toISOString());

    const respond = (chrome.runtime.sendMessage as jest.Mock).mock.calls[0][1];
    respond({ ok: true, metadata: {} });
    await flush();

    expect(wrapper.text()).toContain('synced_at_time');
    expect(wrapper.find('.dot').exists()).toBe(true);
  });
});
