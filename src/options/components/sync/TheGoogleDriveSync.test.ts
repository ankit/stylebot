import { mount } from '@vue/test-utils';
import { SyncState } from '@stylebot/types';

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
    expect(wrapper.find('a').text()).toBe('stylebot/stylebot_v3_backup.json');
  });

  it('names the account the backup is saved to, when known', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncState: {
        ...syncState(new Date().toISOString()),
        account: { email: 'me@example.com' },
      },
      syncInProgress: false,
    });

    expect(wrapper.text()).toContain('me@example.com ›');
  });

  it('says where the backup will live before sync is turned on', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: false,
      googleDriveSyncState: undefined,
      syncInProgress: false,
    });

    expect(wrapper.text()).toContain('sync_drive_location');
  });

  it('disables Sync Now while a sync is already running', () => {
    const wrapper = mountCard({
      googleDriveSyncEnabled: true,
      googleDriveSyncState: syncState(new Date().toISOString()),
      syncInProgress: true,
    });

    expect(wrapper.find('button[disabled]').exists()).toBe(true);
  });

  it('mentions the auto-sync cadence, or the sign-in that is needed instead', () => {
    const enabled = {
      googleDriveSyncEnabled: true,
      googleDriveSyncState: syncState(new Date().toISOString()),
      syncInProgress: false,
    };

    const auto = mountCard({ ...enabled, googleDriveSyncNeedsAuth: false });
    expect(auto.text()).toContain('sync_auto_caption');
    expect(auto.text()).not.toContain('sync_needs_sign_in');

    const signIn = mountCard({ ...enabled, googleDriveSyncNeedsAuth: true });
    expect(signIn.text()).toContain('sync_needs_sign_in');
    expect(signIn.text()).not.toContain('sync_auto_caption');
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
