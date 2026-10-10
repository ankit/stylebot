import type { VersionCss, VersionHistory, Version } from '@stylebot/types';

import { set, subDays } from 'date-fns';

/**
 * Relative to now, so the day grouping reads Today / Yesterday / a weekday
 * whenever a story runs.
 */
const at = (daysAgo: number, hours: number, minutes: number): string =>
  set(subDays(new Date(), daysAgo), {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0,
  }).toISOString();

const rule = (selector: string, ...declarations: Array<string>): string =>
  [`${selector} {`, ...declarations.map(line => `  ${line}`), '}'].join('\n');

const HN = 'news.ycombinator.com';
const GMAIL = 'mail.google.com';

// The versions each site is still as they left it; reddit is still deleted.
const MATCHING_NOW = new Set(['v-9', 'v-7', 'v-4', 'v-3']);

/**
 * A version whose sites were all edited in their default profile.
 */
const version = (
  id: string,
  modifiedTime: string,
  css: Record<string, Pick<VersionCss, 'before' | 'after'>>,
  extra: Partial<Version> = {}
): Version => ({
  id,
  modifiedTime,
  source: 'local',
  css: Object.fromEntries(
    Object.entries(css).map(([url, change]) => [
      url,
      {
        ...change,
        ...(change.after === null
          ? {}
          : { profile: { id: 'default', name: '' } }),
        matchesNow: MATCHING_NOW.has(id),
      },
    ])
  ),
  ...extra,
});

export const versions: Array<Version> = [
  version('v-9', at(0, 17, 58), {
    [HN]: {
      before: rule('.titleline', 'font-size: 13px;'),
      after: rule('.titleline', 'font-size: 15px;'),
    },
  }),
  version('v-8', at(0, 17, 52), {
    [HN]: {
      before: rule('.athing', 'padding: 2px 0;', 'line-height: 1.2;'),
      after: rule(
        '.athing',
        'padding: 6px 0;',
        'line-height: 1.5;',
        'border-bottom: 1px solid #eee;'
      ),
    },
  }),
  version('v-7', at(0, 17, 46), {
    [GMAIL]: {
      before: rule('tr.zA', 'height: 40px;'),
      after: rule('tr.zA', 'height: 32px;', 'font-size: 13px;'),
    },
  }),
  version('v-6', at(0, 17, 40), {
    [HN]: {
      before: rule('body', 'font-family: Verdana;'),
      after: rule('body', 'font-family: Georgia, serif;'),
    },
  }),
  version('v-5', at(0, 17, 30), {
    [GMAIL]: {
      before: rule('.aeN', 'width: 256px;'),
      after: rule('.aeN', 'width: 220px;'),
    },
  }),
  version('v-4', at(1, 22, 10), {
    'www.google.com': {
      before: null,
      after: rule('#hplogo', 'display: none;'),
    },
  }),
  version('v-3', at(1, 21, 20), {
    'old.reddit.com': {
      before: [
        rule('.side', 'display: none;'),
        rule('.content', 'max-width: 820px;', 'margin: 0 auto;'),
      ].join('\n\n'),
      after: null,
    },
  }),
  version(
    'v-2',
    at(1, 20, 5),
    {
      'github.com': {
        before: null,
        after: rule('.markdown-body', 'font-size: 15px;', 'line-height: 1.6;'),
      },
      [HN]: {
        before: null,
        after: rule('#hnmain', 'width: 85%;'),
      },
    },
    { source: 'sync' }
  ),
];

// Every site, by the newest version that touched it.
const sites: VersionHistory['sites'] = [];
versions.forEach(({ css, modifiedTime }) =>
  Object.keys(css).forEach(url => {
    if (!sites.some(site => site.url === url)) {
      sites.push({ url, modifiedTime });
    }
  })
);

export const history = (
  overrides: Partial<VersionHistory> = {}
): VersionHistory => ({
  versions,
  hasMore: false,
  sites,
  ...overrides,
});
