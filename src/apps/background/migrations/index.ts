import ChatRemoval from './chat-removal';
import CommandsToBrowser from './commands-to-browser';
import DefaultShortcutUpdate from './default-shortcut-update';
import StylesMetadataUpdate from './styles-metadata-update';
import StylesModifiedTimeUpdate from './styles-modified-time-update';
import SyncStorageUpdate from './sync-storage-update';

export const MIGRATION_ERRORS_KEY = 'migration_errors';

export type Migration = {
  name: string;
  run: () => Promise<void>;
  everyStart?: boolean;
};

/**
 * The key that records a migration as done, e.g. `migration_chat_removal`.
 */
export const completionKey = (name: string): string =>
  `migration_${name.replace(/-/g, '_')}`;

/**
 * Idempotent repairs of data left by earlier versions, run in order until
 * each succeeds once. `everyStart` is for repairs synced data can still need.
 */
export const migrations: Array<Migration> = [
  { name: 'default-shortcut-update', run: DefaultShortcutUpdate },
  { name: 'commands-to-browser', run: CommandsToBrowser },
  {
    name: 'styles-metadata-update',
    run: StylesMetadataUpdate,
    everyStart: true,
  },
  {
    name: 'styles-modified-time-update',
    run: StylesModifiedTimeUpdate,
    everyStart: true,
  },
  { name: 'sync-storage-update', run: SyncStorageUpdate },
  { name: 'chat-removal', run: ChatRemoval },
];

/**
 * The completion keys already recorded, or none when storage can't be read,
 * which only reruns migrations that are idempotent anyway.
 */
const readCompletionKeys = async (): Promise<Record<string, unknown>> => {
  try {
    return await chrome.storage.local.get(
      migrations.map(migration => completionKey(migration.name))
    );
  } catch (e) {
    console.error('Could not read completed migrations', e);
    return {};
  }
};

/**
 * Runs every migration not yet done, each on its own: one that throws is
 * recorded under MIGRATION_ERRORS_KEY and the rest still run, so startup is
 * never left half done. The record is cleared once a start runs them all
 * cleanly. Never rejects.
 */
const runAll = async (): Promise<void> => {
  const errors: Record<string, string> = {};
  const recorded = await readCompletionKeys();
  const newlyDone: Record<string, true> = {};

  for (const migration of migrations) {
    const key = completionKey(migration.name);

    if (!migration.everyStart && recorded[key]) {
      continue;
    }

    try {
      await migration.run();

      if (!migration.everyStart) {
        newlyDone[key] = true;
      }
    } catch (e) {
      console.error(`Migration ${migration.name} failed`, e);
      errors[migration.name] = e instanceof Error ? e.message : String(e);
    }
  }

  try {
    if (Object.keys(newlyDone).length > 0) {
      await chrome.storage.local.set(newlyDone);
    }
  } catch (e) {
    console.error('Could not record completed migrations', e);
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
