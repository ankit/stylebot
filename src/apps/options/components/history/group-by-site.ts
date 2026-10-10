import type { Version } from '@stylebot/types';

export type SiteGroup = {
  key: string;
  // One site for a run of its edits; several for a change that touched them
  // all at once, such as a restore or a sync.
  urls: Array<string>;
  // Newest first.
  versions: Array<Version>;
};

/**
 * Back-to-back versions of one site, in one profile, gathered into one group,
 * newest first, whatever each did to it. With a site picked, only versions
 * touching it are kept, each read as a change to that site alone.
 */
export const groupBySite = (
  versions: Array<Version>,
  site: string | null = null
): Array<SiteGroup> => {
  const groups: Array<SiteGroup> = [];

  versions.forEach(version => {
    const touched = Object.keys(version.css).sort();
    const urls = site ? touched.filter(url => url === site) : touched;

    if (!urls.length) {
      return;
    }

    const change = urls.length === 1 ? version.css[urls[0]] : null;
    const last = groups[groups.length - 1];
    const lastChange = last?.urls.length === 1 && last.versions[0].css[urls[0]];

    if (
      change &&
      lastChange &&
      last.urls[0] === urls[0] &&
      lastChange.profile?.id === change.profile?.id
    ) {
      last.versions.push(version);
      return;
    }

    groups.push({
      key: `${version.id}:${urls.join(' ')}`,
      urls,
      versions: [version],
    });
  });

  return groups;
};

/**
 * The groups that are current: the newest group for each profile of each
 * site, and only while that profile, or site, is still as it left it.
 */
export const findCurrentGroups = (groups: Array<SiteGroup>): Set<string> => {
  const current = new Set<string>();
  const seen = new Set<string>();

  groups.forEach(({ key, urls, versions }) => {
    const changes = urls.map(url => ({ url, change: versions[0].css[url] }));
    const ids = changes.map(
      ({ url, change }) => `${url} ${change.profile?.id}`
    );
    const newest = ids.every(id => !seen.has(id));

    if (newest && changes.every(({ change }) => change.matchesNow)) {
      current.add(key);
    }

    ids.forEach(id => seen.add(id));
  });

  return current;
};
