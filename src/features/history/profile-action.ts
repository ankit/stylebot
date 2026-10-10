import type { ProfileAction, StyleWithoutUrl } from '@stylebot/types';

/**
 * A profile change, or making another profile active, which the history no
 * longer records but older entries may still hold.
 */
export type ProfileChange =
  | ProfileAction
  | { kind: 'switched'; from: string; to: string };

import { expandProfiles, isEquivalentCss } from '@stylebot/saved-styles';

/**
 * What a change did to a style's profiles, when that is all it did: one
 * profile added, deleted or renamed, or another one made active. Anything
 * more, or any other edit alongside, is an ordinary change and gets null.
 */
export const getProfileAction = (
  before: StyleWithoutUrl | null,
  after: StyleWithoutUrl | null
): ProfileChange | null => {
  if (!before || !after) {
    return null;
  }

  if (
    before.enabled !== after.enabled ||
    before.readability !== after.readability ||
    before.forceImportant !== after.forceImportant
  ) {
    return null;
  }

  const old = expandProfiles(before);
  const now = expandProfiles(after);
  const oldIds = Object.keys(old.sheets);
  const newIds = Object.keys(now.sheets);
  const shared = oldIds.filter(id => now.sheets[id]);

  const sameSheet = (id: string) =>
    old.sheets[id].name === now.sheets[id].name &&
    isEquivalentCss(old.sheets[id].css, now.sheets[id].css);

  // Adding a profile makes it active and removing the active one moves on,
  // so the active profile is only compared once the set of profiles holds.
  if (newIds.length === oldIds.length + 1 && shared.length === oldIds.length) {
    const id = newIds.find(newId => !old.sheets[newId]) as string;

    return shared.every(sameSheet)
      ? { kind: 'added', id, name: now.sheets[id].name }
      : null;
  }

  if (oldIds.length === newIds.length + 1 && shared.length === newIds.length) {
    const id = oldIds.find(oldId => !now.sheets[oldId]) as string;

    return shared.every(sameSheet)
      ? { kind: 'deleted', id, name: old.sheets[id].name }
      : null;
  }

  if (shared.length !== oldIds.length || shared.length !== newIds.length) {
    return null;
  }

  const renamed = shared.filter(
    id => old.sheets[id].name !== now.sheets[id].name
  );
  const cssSame = shared.every(id =>
    isEquivalentCss(old.sheets[id].css, now.sheets[id].css)
  );

  if (!cssSame) {
    return null;
  }

  if (renamed.length === 1 && old.active === now.active) {
    return {
      kind: 'renamed',
      from: old.sheets[renamed[0]].name,
      to: now.sheets[renamed[0]].name,
    };
  }

  if (renamed.length === 0 && old.active !== now.active) {
    return {
      kind: 'switched',
      from: old.sheets[old.active].name,
      to: now.sheets[now.active].name,
    };
  }

  return null;
};
