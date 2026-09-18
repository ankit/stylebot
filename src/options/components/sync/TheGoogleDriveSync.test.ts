import { mount } from '@vue/test-utils';

import TheGoogleDriveSync from './TheGoogleDriveSync.vue';

const mountCard = (state: Record<string, unknown>) =>
  mount(TheGoogleDriveSync, {
    mocks: {
      $store: { state, dispatch: jest.fn() },
    },
  });

const metadata = (modifiedTime: unknown) => ({
  id: 'file-id',
  modifiedTime,
  webViewLink: 'https://drive.google.com/view',
  webContentLink: 'https://drive.google.com/download',
});

describe('TheGoogleDriveSync.vue', () => {
  it('renders the not-connected copy from a locale key when sync is off', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: false,
      googleDriveSyncMetadata: undefined,
      syncInProgress: false,
    });

    expect(wrapper.text()).toContain('sync_not_connected');
  });

  it('renders without throwing when the stored timestamp is unparseable', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncMetadata: metadata('not-a-date'),
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
      googleDriveSyncMetadata: metadata(undefined),
      syncInProgress: false,
    });

    expect(wrapper.text()).not.toContain('Invalid Date');
  });

  it('shows the synced-at line for a valid timestamp', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncMetadata: metadata(new Date().toISOString()),
      syncInProgress: false,
    });

    expect(wrapper.text()).toContain('synced_at_time');
  });

  it('disables Sync Now while a sync is already running', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncMetadata: metadata(new Date().toISOString()),
      syncInProgress: true,
    });

    expect(wrapper.find('button[disabled]').exists()).toBe(true);
  });
});
