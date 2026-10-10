import type { Version } from '@stylebot/types';

import { findCurrentGroups, groupBySite } from './group-by-site';

const version = (
  id: string,
  urls: Array<string>,
  profile?: string
): Version => ({
  id,
  modifiedTime: '2026-10-09T12:00:00.000Z',
  source: 'local',
  css: Object.fromEntries(
    urls.map(url => [
      url,
      {
        before: '',
        after: '',
        matchesNow: false,
        ...(profile ? { profile: { id: profile, name: profile } } : {}),
      },
    ])
  ),
});

const ids = (groups: ReturnType<typeof groupBySite>) =>
  groups.map(({ urls, versions }) => ({
    urls,
    ids: versions.map(({ id }) => id),
  }));

describe('groupBySite', () => {
  const versions = [
    version('a', ['hn']),
    version('b', ['hn']),
    version('c', ['gmail']),
    version('d', ['hn']),
    version('e', ['gmail', 'hn']),
  ];

  it('gathers back-to-back versions of a site', () => {
    expect(ids(groupBySite(versions))).toEqual([
      { urls: ['hn'], ids: ['a', 'b'] },
      { urls: ['gmail'], ids: ['c'] },
      { urls: ['hn'], ids: ['d'] },
      { urls: ['gmail', 'hn'], ids: ['e'] },
    ]);
  });

  it('reads every version as a change to the picked site', () => {
    expect(ids(groupBySite(versions, 'gmail'))).toEqual([
      { urls: ['gmail'], ids: ['c', 'e'] },
    ]);

    expect(ids(groupBySite(versions, 'hn'))).toEqual([
      { urls: ['hn'], ids: ['a', 'b', 'd', 'e'] },
    ]);
  });

  it('keeps edits to different profiles of a site apart', () => {
    expect(
      ids(
        groupBySite([
          version('a', ['yt'], 'dark'),
          version('b', ['yt'], 'dark'),
          version('c', ['yt'], 'light'),
        ])
      ).map(group => group.ids)
    ).toEqual([['a', 'b'], ['c']]);
  });

  it('marks only the newest matching group of each profile current', () => {
    const matching = (id: string, profile: string): Version => {
      const base = version(id, ['yt'], profile);
      base.css.yt.matchesNow = true;
      return base;
    };

    const groups = groupBySite([
      matching('a', 'dark'),
      version('b', ['yt'], 'light'),
      matching('c', 'light'),
      matching('d', 'dark'),
    ]);

    expect([...findCurrentGroups(groups)]).toEqual([groups[0].key]);
  });
});
