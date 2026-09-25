import { mount } from '@vue/test-utils';
import type { SyncState } from '@stylebot/types';

import TheGoogleDriveSync from './TheGoogleDriveSync.vue';

const dispatch = jest.fn();

const mountCard = (state: Record<string, unknown>) =>
  mount(TheGoogleDriveSync, {
    mocks: {
      $store: { state, dispatch },
    },
  });

const syncState = (lastSyncedAt: unknown): SyncState =>
  ({
    remoteRevision: '2024-01-01T00:00:00.000Z',
    localRevision: 'local-1',
    lastSyncedAt,
    metadata: {
      id: 'file-id',
      modifiedTime: '2024-01-01T00:00:00.000Z',
      webViewLink: 'https://drive.google.com/view',
      webContentLink: 'https://drive.google.com/download',
    },
  } as SyncState);

describe('TheGoogleDriveSync.vue', () => {
  it('renders the not-connected copy from a locale key when sync is off', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: false,
      googleDriveSyncState: undefined,
      syncInProgress: false,
    });

    expect(wrapper.text()).toContain('sync_disconnected_title');
    expect(wrapper.text()).toContain('sync_not_connected');
    expect(wrapper.text()).toContain('sync_google_drive_description');
    expect(wrapper.find('button.primary').text()).toBe('sync_connect');
  });

  it('renders without throwing when the stored timestamp is unparseable', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncState: syncState('not-a-date'),
      syncInProgress: false,
    });

    // The title proves the render completed rather than bailing out on a
    // RangeError from date-fns, which is what the unguarded format did.
    expect(wrapper.text()).toContain('sync_connected_title');
    expect(wrapper.text()).not.toContain('Invalid Date');
    expect(wrapper.text()).not.toContain('synced_at_time');
  });

  it('renders without throwing when there is no timestamp at all', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncState: syncState(undefined),
      syncInProgress: false,
    });

    expect(wrapper.text()).toContain('sync_connected_title');
    expect(wrapper.text()).not.toContain('Invalid Date');
  });

  it('shows the synced-at line for a valid timestamp', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncState: syncState(new Date().toISOString()),
      syncInProgress: false,
    });

    expect(wrapper.text()).toContain('synced_at_time');
  });

  it('links the backup path to the file on Drive, after the account it lives in', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncState: {
        ...syncState(new Date().toISOString()),
        account: { email: 'me@example.com' },
      },
      syncInProgress: false,
    });

    const link = wrapper.find('a.path');
    expect(link.attributes('href')).toBe('https://drive.google.com/view');
    expect(link.text()).toContain('stylebot/stylebot_v3_backup.json');
    expect(wrapper.text()).toContain('me@example.com');
  });

  it('shows the path without a link or account when neither is known yet', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncState: undefined,
      syncInProgress: false,
    });

    expect(wrapper.find('a.path').exists()).toBe(false);
    expect(wrapper.text()).toContain('stylebot/stylebot_v3_backup.json');
  });

  it('disables Sync Now while a sync is already running', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncState: syncState(new Date().toISOString()),
      syncInProgress: true,
    });

    expect(wrapper.find('button[disabled]').exists()).toBe(true);
  });

  it('states the schedule, and flags a pending sign-in in place of the synced pill', () => {
    const enabled = {
      googleDriveSyncEnabled: true,
      googleDriveSyncState: syncState(new Date().toISOString()),
      syncInProgress: false,
    };

    const synced = mountCard({ ...enabled, googleDriveSyncNeedsAuth: false });
    expect(synced.text()).toContain('sync_schedule_value');
    expect(synced.text()).toContain('synced_at_time');
    expect(synced.text()).not.toContain('sync_needs_sign_in');

    const signIn = mountCard({ ...enabled, googleDriveSyncNeedsAuth: true });
    expect(signIn.text()).toContain('sync_needs_sign_in');
    expect(signIn.text()).not.toContain('synced_at_time');
  });

  it('lists conflicts with a way to open the style and to dismiss it', async () => {
    dispatch.mockClear();

    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncState: {
        ...syncState(new Date().toISOString()),
        conflicts: [{ url: 'example.com', at: '2026-09-18T00:00:00.000Z' }],
      },
      syncInProgress: false,
    });

    expect(wrapper.text()).toContain('sync_conflicts_title');
    expect(wrapper.text()).toContain('example.com');

    const buttons = wrapper.findAll('.conflict button');
    await buttons.at(0).trigger('click');
    expect(wrapper.emitted('edit')).toEqual([['example.com']]);

    await buttons.at(1).trigger('click');
    expect(dispatch).toBeCalledWith('dismissSyncConflict', 'example.com');
  });

  it('shows no conflict block when there are none', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncState: syncState(new Date().toISOString()),
      syncInProgress: false,
    });

    expect(wrapper.text()).not.toContain('sync_conflicts_title');
  });
});
