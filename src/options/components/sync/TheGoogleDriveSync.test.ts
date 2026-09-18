import { mount } from '@vue/test-utils';
import { SyncState } from '@stylebot/types';

import TheGoogleDriveSync from './TheGoogleDriveSync.vue';

const mountCard = (state: Record<string, unknown>) =>
  mount(TheGoogleDriveSync, {
    mocks: {
      $store: { state, dispatch: jest.fn() },
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
  }) as SyncState;

describe('TheGoogleDriveSync.vue', () => {
  it('renders the not-connected copy from a locale key when sync is off', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: false,
      googleDriveSyncState: undefined,
      syncInProgress: false,
    });

    expect(wrapper.text()).toContain('sync_not_connected');
  });

  it('renders without throwing when the stored timestamp is unparseable', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncState: syncState('not-a-date'),
      syncInProgress: false,
    });

    // The heading proves the render completed rather than bailing out on a
    // RangeError from date-fns, which is what the unguarded format did.
    expect(wrapper.text()).toContain('google_drive');
    expect(wrapper.text()).not.toContain('Invalid Date');
    expect(wrapper.text()).not.toContain('synced_at_time');
  });

  it('renders without throwing when there is no timestamp at all', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncState: syncState(undefined),
      syncInProgress: false,
    });

    expect(wrapper.text()).toContain('google_drive');
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

  it('shows the view and download links from the stored metadata', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncState: syncState(new Date().toISOString()),
      syncInProgress: false,
    });

    const hrefs = wrapper.findAll('a').wrappers.map(a => a.attributes('href'));
    expect(hrefs).toEqual([
      'https://drive.google.com/view',
      'https://drive.google.com/download',
    ]);
  });

  it('disables Sync Now while a sync is already running', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncState: syncState(new Date().toISOString()),
      syncInProgress: true,
    });

    expect(wrapper.find('button[disabled]').exists()).toBe(true);
  });
});
