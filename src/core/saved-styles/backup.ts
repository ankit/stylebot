import type { StyleMap, StyleWithoutUrl, Timestamp } from '@stylebot/types';

import { isEquivalentStyle } from './equivalence';
import { isStyleMap, sanitizeStyleMap } from './style-map';

export const BACKUP_FORMAT = 'stylebot-backup';
export const BACKUP_VERSION = 1;

export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: Timestamp;
  styles: StyleMap;
};

export type BackupErrorKey =
  | 'import_error_not_json'
  | 'import_error_not_backup'
  | 'import_error_empty'
  | 'import_error_newer_version';

export type ParsedBackup =
  | { ok: true; styles: StyleMap }
  | { ok: false; errorKey: BackupErrorKey };

/**
 * How importing a backup would change the saved styles: urls it adds, urls
 * whose style it changes, urls it already matches, and saved urls it lacks.
 */
export type ImportPreview = {
  added: number;
  updated: number;
  unchanged: number;
  notInBackup: number;
};

/**
 * Wraps the styles in a versioned envelope, so an import can tell a backup
 * apart from any other JSON and a later format can migrate this one.
 */
export const createBackup = (
  styles: StyleMap,
  exportedAt: Timestamp
): Backup => ({
  format: BACKUP_FORMAT,
  version: BACKUP_VERSION,
  exportedAt,
  styles,
});

/**
 * Names a backup after the local date it was made, so exports on different
 * days don't collide in the downloads folder.
 */
export const getBackupFilename = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-');

  return `stylebot-backup-${day}.json`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Fills in the fields a hand-edited or older backup may lack, so every
 * imported style has the shape the rest of the extension reads.
 */
const withDefaults = (style: StyleWithoutUrl): StyleWithoutUrl => ({
  ...style,
  enabled: typeof style.enabled === 'boolean' ? style.enabled : true,
  readability:
    typeof style.readability === 'boolean' ? style.readability : false,
  modifiedTime:
    typeof style.modifiedTime === 'string' ? style.modifiedTime : '',
});

/**
 * Reads a backup file's text into a style map. Accepts the versioned
 * envelope and the bare style map that earlier versions exported.
 */
export const parseBackup = (text: string): ParsedBackup => {
  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, errorKey: 'import_error_not_json' };
  }

  let styles: unknown = value;

  if (isRecord(value) && value.format === BACKUP_FORMAT) {
    if (typeof value.version !== 'number') {
      return { ok: false, errorKey: 'import_error_not_backup' };
    }

    if (value.version > BACKUP_VERSION) {
      return { ok: false, errorKey: 'import_error_newer_version' };
    }

    styles = value.styles;
  }

  if (!isStyleMap(styles)) {
    return { ok: false, errorKey: 'import_error_not_backup' };
  }

  const entries = Object.entries(sanitizeStyleMap(styles)).filter(
    ([url]) => url.trim() !== ''
  );

  if (entries.length === 0) {
    return { ok: false, errorKey: 'import_error_empty' };
  }

  return {
    ok: true,
    styles: Object.fromEntries(
      entries.map(([url, style]) => [url, withDefaults(style)])
    ),
  };
};

export const previewImport = (
  current: StyleMap,
  incoming: StyleMap
): ImportPreview => {
  const preview = { added: 0, updated: 0, unchanged: 0, notInBackup: 0 };

  for (const [url, style] of Object.entries(incoming)) {
    if (!current[url]) {
      preview.added++;
    } else if (isEquivalentStyle(current[url], style)) {
      preview.unchanged++;
    } else {
      preview.updated++;
    }
  }

  preview.notInBackup = Object.keys(current).filter(
    url => !incoming[url]
  ).length;

  return preview;
};

/**
 * The saved styles with the backup's added and changed styles laid over
 * them. Saved styles the backup lacks, or already matches, stay as they are.
 */
export const mergeBackup = (
  current: StyleMap,
  incoming: StyleMap
): StyleMap => {
  const merged = { ...current };

  for (const [url, style] of Object.entries(incoming)) {
    if (!isEquivalentStyle(current[url], style)) {
      merged[url] = style;
    }
  }

  return merged;
};
