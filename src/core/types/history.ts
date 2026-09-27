import type { Timestamp } from './shared';
import type { StyleWithoutUrl } from './styles';

/**
 * Whether a change was made here or arrived from another computer.
 */
export type VersionSource = 'local' | 'sync';

/**
 * One point the styles can be put back to, kept on this computer.
 */
export type VersionEntry = {
  id: string;
  // When the change began; a run of edits keeps the time of its first write.
  modifiedTime: Timestamp;
  source: VersionSource;
  // The value each style the change touched had before it, or null for one
  // the change created.
  before: Record<string, StyleWithoutUrl | null>;
  // When the version a restore put back was made. Absent on an ordinary edit.
  restoredFrom?: Timestamp;
};

/**
 * One version as the list shows it: the entry without the styles it holds.
 */
export type Version = Omit<VersionEntry, 'before'>;

/**
 * The versions kept on this computer, each with what its change did and what
 * restoring it would do to the styles now.
 */
export type VersionHistory = {
  versions: Array<Version>;
  previews: Record<string, VersionPreview>;
  // What each version changed about the one before it, which is what that
  // save did.
  changes: Record<string, VersionChange>;
  // How many are held, which may be more than were asked for.
  total: number;
};

/**
 * How two style maps differ: what the later one holds and the earlier does
 * not, what both hold but differ over, and what only the earlier holds.
 */
export type VersionChange = {
  addedUrls: Array<string>;
  changedUrls: Array<string>;
  removedUrls: Array<string>;
};

/**
 * What restoring a version would do to the styles you have now, which is the
 * same difference read forwards: `addedUrls` comes back, `changedUrls` rolls
 * back to the version's copy, and `removedUrls` is what only you have, which
 * a whole-version restore would delete.
 */
export type VersionPreview = VersionChange & {
  styleCount: number;
};
