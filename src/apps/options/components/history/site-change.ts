import type { ProfileAction } from '@stylebot/types';

import type { CssDiff } from './diff-css';
import { diffCss } from './diff-css';
import type { SiteGroup } from './group-by-site';

export type SiteChange = CssDiff & {
  url: string;
  // What happened to the site itself; a profile change is a change.
  status: 'added' | 'changed' | 'deleted';
  // Whether the group deleted the site, or the profile it changed.
  deleted: boolean;
};

// Diffs by group and site, so rows are not diffed again on every read.
const diffs = new Map<string, CssDiff>();

/**
 * What a group did to one of its sites, from before its oldest version to
 * after its newest.
 */
export const getSiteChange = (group: SiteGroup, url: string): SiteChange => {
  const oldest = group.versions[group.versions.length - 1];
  const newest = group.versions[0].css[url];
  const before = oldest.css[url]?.before;
  const after = newest?.after ?? null;

  const profileChanged = group.versions.some(
    version => version.css[url]?.profileAction
  );

  let status: SiteChange['status'] = 'changed';
  if (!profileChanged && after === null) {
    status = 'deleted';
  } else if (!profileChanged && before === null) {
    status = 'added';
  }

  const key = `${oldest.id} ${group.versions[0].id} ${url}`;
  const diff = diffs.get(key) ?? diffCss(before ?? null, after);
  diffs.set(key, diff);

  return {
    url,
    status,
    deleted:
      status === 'deleted' || getNetAction(group, url)?.kind === 'deleted',
    ...diff,
  };
};

/**
 * What a group did to one site's profile overall, when that is all it did:
 * a run that started without the profile and ended with it added it, one
 * that went the other way deleted it, and renames alone renamed it.
 */
export const getNetAction = (
  group: SiteGroup,
  url: string
): ProfileAction | null => {
  const changes = group.versions.map(version => version.css[url]);
  const newest = changes[0];
  const oldest = changes[changes.length - 1];

  if (changes.length === 1) {
    return newest?.profileAction ?? null;
  }

  const renames = changes.map(change => change?.profileAction);
  if (renames.every(action => action?.kind === 'renamed')) {
    const from = renames[renames.length - 1];
    const to = renames[0];

    return from?.kind === 'renamed' && to?.kind === 'renamed'
      ? { kind: 'renamed', from: from.from, to: to.to }
      : null;
  }

  if (!newest?.profile || !changes.some(change => change?.profileAction)) {
    return null;
  }

  if (oldest?.before === null && newest.after !== null) {
    return { kind: 'added', ...newest.profile };
  }

  return oldest?.before !== null && newest.after === null
    ? { kind: 'deleted', ...newest.profile }
    : null;
};

/**
 * Whether a run of changes to one site's profile came to nothing: it began
 * and ended without the profile, or renamed it back to what it was.
 */
export const isCancelledOut = (group: SiteGroup): boolean => {
  if (group.urls.length !== 1 || group.versions.length === 1) {
    return false;
  }

  const [url] = group.urls;
  const net = getNetAction(group, url);
  const newest = group.versions[0].css[url];
  const oldest = group.versions[group.versions.length - 1].css[url];

  return net?.kind === 'renamed'
    ? net.from === net.to
    : oldest?.before === null && newest?.after === null;
};
