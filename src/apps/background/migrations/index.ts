import CommandsToBrowser from './commands-to-browser';
import DefaultShortcutUpdate from './default-shortcut-update';
import StylesMetadataUpdate from './styles-metadata-update';
import StylesModifiedTimeUpdate from './styles-modified-time-update';
import SyncStorageUpdate from './sync-storage-update';

export const MIGRATION_ERRORS_KEY = 'migration_errors';

export type Migration = {
  name: string;
  run: () => Promise<void>;
};

/**
 * One-off repairs of stored data left by earlier versions, run in order on
 * every background start. Each is idempotent and cheap once it has nothing
 * to do. A migration that needs a completion flag stores it under a
 * `migration_` prefixed key; default_shortcut_update_complete predates the
 * convention and is left alone, since renaming it would rerun that reset.
 */
export const migrations: Array<Migration> = [
  { name: 'default-shortcut-update', run: DefaultShortcutUpdate },
  { name: 'commands-to-browser', run: CommandsToBrowser },
  { name: 'styles-metadata-update', run: StylesMetadataUpdate },
  { name: 'styles-modified-time-update', run: StylesModifiedTimeUpdate },
  { name: 'sync-storage-update', run: SyncStorageUpdate },
];

/**
 * Runs every migration, each on its own: one that throws is recorded under
 * MIGRATION_ERRORS_KEY and the rest still run, so startup is never left
 * half done. The record is cleared once a start runs them all cleanly.
 * Never rejects.
 */
const runAll = async (): Promise<void> => {
  const errors: Record<string, string> = {};

  for (const migration of migrations) {
    try {
      await migration.run();
    } catch (e) {
      console.error(`Migration ${migration.name} failed`, e);
      errors[migration.name] = e instanceof Error ? e.message : String(e);
    }
  }

  try {
    if (Object.keys(errors).length > 0) {
      await chrome.storage.local.set({ [MIGRATION_ERRORS_KEY]: errors });
    } else {
      await chrome.storage.local.remove(MIGRATION_ERRORS_KEY);
    }
  } catch (e) {
    console.error('Could not record migration errors', e);
  }
};

let migrated: Promise<void> | undefined;

/**
 * Runs the migrations once per background start, and resolves when they are
 * done. Anything that reads styles to write or sync them awaits this, so it
 * never sees data a migration is about to repair.
 */
export const runMigrations = (): Promise<void> => {
  migrated = migrated ?? runAll();
  return migrated;
};
