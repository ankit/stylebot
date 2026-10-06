import { BACKUP_BEFORE_V4_KEY } from '@stylebot/saved-styles';
import type { BackupBeforeV4 as Backup } from '@stylebot/saved-styles';
import { getCurrentTimestamp } from '@stylebot/utils';

/**
 * The keys the migrations rewrite, plus the settings stored beside them.
 */
const BACKED_UP_KEYS = [
  'styles',
  'styles-metadata',
  'options',
  'commands',
  'google-drive-sync',
  'google-drive-sync-state',
];

/**
 * Copies the stored data, as it is, before the first migration of 4.0 rewrites
 * it, so a migration bug can be undone from the options page. Runs once: the
 * backup's own key is the flag, and a later backup would hold migrated data.
 */
const BackupBeforeV4 = async (): Promise<void> => {
  const { [BACKUP_BEFORE_V4_KEY]: existing } = await chrome.storage.local.get(
    BACKUP_BEFORE_V4_KEY
  );

  if (existing) {
    return;
  }

  const backup: Backup = {
    createdAt: getCurrentTimestamp(),
    items: await chrome.storage.local.get(BACKED_UP_KEYS),
  };

  await chrome.storage.local.set({ [BACKUP_BEFORE_V4_KEY]: backup });
};

export default BackupBeforeV4;
