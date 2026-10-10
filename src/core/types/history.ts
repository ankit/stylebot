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
 * What a version's change did to one site: the css of the profile it was
 * made in, before and after, null where there was none.
 */
export type VersionCss = {
  before: string | null;
  after: string | null;
  // The profile the change was made in — or added, deleted or renamed — with
  // its name then (empty for the default). Absent when the site was deleted.
  profile?: { id: string; name: string };
  // Set when all the change did was add, delete or rename a profile.
  profileAction?: ProfileAction;
  // Whether the site, or the profile, is still as this change left it.
  matchesNow: boolean;
};

/**
 * A change that touched a style's profiles and nothing else. A default
 * profile's name is empty.
 */
export type ProfileAction =
  | { kind: 'added'; id: string; name: string }
  | { kind: 'deleted'; id: string; name: string }
  | { kind: 'renamed'; from: string; to: string };

/**
 * One version as the list shows it: the entry with the css of each site its
 * change touched, in place of the styles it holds.
 */
export type Version = Omit<VersionEntry, 'before'> & {
  css: Record<string, VersionCss>;
};

/**
 * The versions read from those kept on this computer.
 */
export type VersionHistory = {
  versions: Array<Version>;
  // Whether older versions are kept past the ones read.
  hasMore: boolean;
  // Every site in the history, by when it was last edited, newest first.
  sites: Array<{ url: string; modifiedTime: Timestamp }>;
};

/**
 * How much of a version a restore puts back.
 */
export type RestoreOptions = {
  // Only these sites; absent restores every site.
  urls?: Array<string>;
  // The styles just before the version's change, rather than after it.
  before?: boolean;
  // Only this profile of the one site in `urls`.
  profileId?: string;
};

/**
 * Whether a restore happened, and the history entry it recorded, which Undo
 * takes back. Absent when the restore changed nothing.
 */
export type RestoreResult = { ok: boolean; entryId?: string };
