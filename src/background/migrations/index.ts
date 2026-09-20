import DefaultShortcutUpdate from './default-shortcut-update';
import StylesMetadataUpdate from './styles-metadata-update';
import StylesModifiedTimeUpdate from './styles-modified-time-update';
import SyncStorageUpdate from './sync-storage-update';

/**
 * One-off repairs of stored data left by earlier versions, run in order on
 * every background start. Each is idempotent and cheap once it has nothing
 * to do. A migration that needs a completion flag stores it under a
 * `migration_` prefixed key; default_shortcut_update_complete predates the
 * convention and is left alone, since renaming it would rerun that reset.
 */
export const runMigrations = async (): Promise<void> => {
  await DefaultShortcutUpdate();
  await StylesMetadataUpdate();
  await StylesModifiedTimeUpdate();
  await SyncStorageUpdate();
};
