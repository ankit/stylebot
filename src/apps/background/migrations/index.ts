import BackupBeforeV4 from './backup-before-v4';
import CommandsToBrowser from './commands-to-browser';
import StylesMetadataUpdate from './styles-metadata-update';
import StylesModifiedTimeUpdate from './styles-modified-time-update';
import SyncStorageUpdate from './sync-storage-update';

export const MIGRATION_ERRORS_KEY = 'migration_errors';

export type Migration = {
  name: string;
  run: () => Promise<void>;

  /**
   * The last release that stores the data this migration repairs. A test
   * flags the migration for removal once enough releases have passed it.
   */
  oldDataUntil: string;
};

/**
 * One-off repairs of stored data left by earlier versions, run in order on
 * every background start. Each is idempotent and cheap once it has nothing
 * to do. A migration that needs a completion flag stores it under a
 * `migration_` prefixed key.
 */
export const migrations: Array<Migration> = [
  { name: 'backup-before-v4', run: BackupBeforeV4, oldDataUntil: '3.2.4' },
  {
    name: 'commands-to-browser',
    run: CommandsToBrowser,
    oldDataUntil: '3.2.4',
  },
  {
    name: 'styles-metadata-update',
    run: StylesMetadataUpdate,
    oldDataUntil: '3.2.4',
  },
  {
    name: 'styles-modified-time-update',
    run: StylesModifiedTimeUpdate,
    oldDataUntil: '3.2.4',
  },
  {
    name: 'sync-storage-update',
    run: SyncStorageUpdate,
    oldDataUntil: '3.2.4',
  },
];

/**
 * Runs every migration, each on its own: one that throws is recorded under
 * MIGRATION_ERRORS_KEY and the rest still run, so startup is never left
 * half done. Never rejects.
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
