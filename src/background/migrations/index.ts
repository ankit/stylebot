import DefaultShortcutUpdate from './default-shortcut-update';
import StylesMetadataUpdate from './styles-metadata-update';
import StylesModifiedTimeUpdate from './styles-modified-time-update';

/**
 * One-off repairs of stored data left by earlier versions, run in order on
 * every background start. Each is idempotent and cheap once it has nothing
 * to do.
 */
export const runMigrations = async (): Promise<void> => {
  await DefaultShortcutUpdate();
  await StylesMetadataUpdate();
  await StylesModifiedTimeUpdate();
};
