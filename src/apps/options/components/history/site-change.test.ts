import type { ProfileAction, Version } from '@stylebot/types';

import type { SiteGroup } from './group-by-site';
import { getNetAction, isCancelledOut } from './site-change';

const DARK = { id: 'dark', name: 'Dark' };

/**
 * A run of changes to news.com's Dark profile, newest first, each given as
 * its css before and after and what it did to the profile.
 */
const run = (
  ...changes: Array<[string | null, string | null, ProfileAction?]>
): SiteGroup => ({
  key: 'run',
  urls: ['news.com'],
  versions: changes.map(
    ([before, after, profileAction], index): Version => ({
      id: String(index),
      modifiedTime: '2026-10-09T12:00:00.000Z',
      source: 'local',
      css: {
        'news.com': {
          before,
          after,
          profile: DARK,
          matchesNow: false,
          ...(profileAction ? { profileAction } : {}),
        },
      },
    })
  ),
});

const deleted: ProfileAction = { kind: 'deleted', ...DARK };
const added: ProfileAction = { kind: 'added', ...DARK };

describe('getNetAction', () => {
  it('reads delete, add, delete as one deletion', () => {
    const group = run(
      ['a {}', null, deleted],
      [null, 'a {}', added],
      ['a {}', null, deleted]
    );

    expect(getNetAction(group, 'news.com')).toEqual(deleted);
    expect(isCancelledOut(group)).toBe(false);
  });

  it('reads an add followed by edits as an addition', () => {
    const group = run(['a {}', 'b {}'], [null, 'a {}', added]);

    expect(getNetAction(group, 'news.com')).toEqual(added);
  });

  it('reads a run of renames as one rename', () => {
    const group = run(
      ['a {}', 'a {}', { kind: 'renamed', from: 'Night', to: 'Dark' }],
      ['a {}', 'a {}', { kind: 'renamed', from: 'Midnight', to: 'Night' }]
    );

    expect(getNetAction(group, 'news.com')).toEqual({
      kind: 'renamed',
      from: 'Midnight',
      to: 'Dark',
    });
  });

  it('leaves edits alone', () => {
    expect(
      getNetAction(run(['b {}', 'c {}'], ['a {}', 'b {}']), 'news.com')
    ).toBeNull();
  });
});

describe('isCancelledOut', () => {
  it('drops an add followed by a delete', () => {
    expect(
      isCancelledOut(run(['a {}', null, deleted], [null, 'a {}', added]))
    ).toBe(true);
  });

  it('drops a rename and its rename back', () => {
    expect(
      isCancelledOut(
        run(
          ['a {}', 'a {}', { kind: 'renamed', from: 'Night', to: 'Dark' }],
          ['a {}', 'a {}', { kind: 'renamed', from: 'Dark', to: 'Night' }]
        )
      )
    ).toBe(true);
  });
});
