import { GoogleDriveSyncMetadata, SyncState } from '@stylebot/types';

/**
 * Seeds the sync state from the metadata earlier versions stored, so an
 * upgrading user is not treated as having never synced.
 */
const SyncStorageUpdate = async (): Promise<void> => {
  const key = 'sync_storage_update_complete';

  return new Promise(resolve => {
    chrome.storage.local.get(
      [key, 'google-drive-sync', 'google-drive-sync-state'],
      items => {
        if (items[key] || items['google-drive-sync-state']) {
          resolve();
          return;
        }

        const legacy: GoogleDriveSyncMetadata | undefined =
          items['google-drive-sync'];

        const update: Record<string, unknown> = { [key]: true };

        if (legacy?.id && legacy.modifiedTime) {
          const state: SyncState = {
            metadata: legacy,
            remoteRevision: legacy.modifiedTime,
            lastSyncedAt: legacy.modifiedTime,

            // The old format recorded no local revision. Leaving it empty makes
            // the first run after upgrading see a local change, so it pushes or
            // merges — never a one-sided overwrite that could drop styles.
            localRevision: '',
          };

          update['google-drive-sync-state'] = state;
        }

        chrome.storage.local.set(update, () => resolve());
      }
    );
  });
};

export default SyncStorageUpdate;
