import { getDefaultScope, getScopeSlots } from './selector-scopes';
import type { SelectorAlternatives } from './selector-scopes';

type Counts = Record<string, number>;

/**
 * Returns the scopes for these alternatives and match counts.
 */
const slotsFor = (alternatives: SelectorAlternatives, counts: Counts) =>
  getScopeSlots({ ...alternatives, counts });

/**
 * Returns the scope the field starts on for these alternatives and counts.
 */
const defaultScope = (alternatives: SelectorAlternatives, counts: Counts) =>
  getDefaultScope({ ...alternatives, counts });

const TITLES: SelectorAlternatives = {
  existing: [],
  candidates: [
    '#story-3',
    'tr.athing .titleline > a',
    'span.titleline a',
    'td a',
  ],
  descriptions: {
    'tr.athing .titleline > a': { role: 'similar' },
    'span.titleline a': { role: 'all' },
    'td a': { role: 'all' },
  },
};

const TITLE_COUNTS = {
  '#story-3': 1,
  'tr.athing .titleline > a': 30,
  'span.titleline a': 60,
  'td a': 120,
};

/**
 * Returns the titles' alternatives with `saved` as a saved rule, in place
 * of the suggestion `replaces` that matches the same elements.
 */
const withSaved = (saved: string, replaces: string): SelectorAlternatives => ({
  existing: [saved],
  candidates: TITLES.candidates.map(s => (s === replaces ? saved : s)),
  descriptions: Object.fromEntries(
    Object.entries(TITLES.descriptions ?? {}).map(([s, description]) => [
      s === replaces ? saved : s,
      description,
    ])
  ),
});

/**
 * Returns the titles' counts with `saved` in place of `replaces`.
 */
const countsWithSaved = (saved: string, replaces: string): Counts =>
  Object.fromEntries(
    Object.entries(TITLE_COUNTS).map(([s, count]) => [
      s === replaces ? saved : s,
      count,
    ])
  );

describe('getScopeSlots', () => {
  it('offers the one-element candidate as Only and the widest as All', () => {
    const slots = slotsFor(
      {
        existing: [],
        candidates: ['#login', '.card a', 'a'],
      },
      { '#login': 1, '.card a': 4, a: 20 }
    );

    expect(slots).toEqual({ only: '#login', similar: undefined, all: 'a' });
  });

  it('leaves Only out when the one-element candidate is too tied to the structure', () => {
    const slots = slotsFor(
      {
        existing: [],
        candidates: ['main > div > ul > li:nth-of-type(2) > a', 'a'],
      },
      { 'main > div > ul > li:nth-of-type(2) > a': 1, a: 5 }
    );

    expect(slots).toEqual({ only: undefined, similar: undefined, all: 'a' });
  });

  it('leaves All out when nothing reaches more than one element', () => {
    const slots = slotsFor({ existing: [], candidates: ['h1'] }, { h1: 1 });

    expect(slots).toEqual({ only: 'h1', similar: undefined, all: undefined });
  });

  it('offers nothing before the counts arrive', () => {
    const slots = slotsFor({ existing: [], candidates: ['h1', 'body h1'] }, {});

    expect(slots).toEqual({
      only: undefined,
      similar: undefined,
      all: undefined,
    });
  });

  it('offers the widest similar candidate as Similar, and the widest as All', () => {
    const slots = slotsFor(
      {
        existing: [],
        candidates: [
          '#story-3',
          'tr.athing .titleline > a',
          '.titleline a',
          'a',
        ],
        descriptions: {
          'tr.athing .titleline > a': { role: 'similar' },
          '.titleline a': { role: 'similar' },
          a: { role: 'all' },
        },
      },
      {
        '#story-3': 1,
        'tr.athing .titleline > a': 30,
        '.titleline a': 60,
        a: 200,
      }
    );

    expect(slots).toEqual({
      only: '#story-3',
      similar: '.titleline a',
      all: 'a',
    });
  });

  it('offers a wider candidate as All than the similar one', () => {
    const slots = slotsFor(
      {
        existing: [],
        candidates: [
          '#story-3',
          'td.title > span.titleline > a',
          'td.title a',
          'a',
        ],
        descriptions: { 'td.title > span.titleline > a': { role: 'similar' } },
      },
      {
        '#story-3': 1,
        'td.title > span.titleline > a': 30,
        'td.title a': 60,
        a: 200,
      }
    );

    expect(slots).toEqual({
      only: '#story-3',
      similar: 'td.title > span.titleline > a',
      all: 'a',
    });
  });

  it('leaves All out when nothing reaches further than Similar', () => {
    const slots = slotsFor(
      {
        existing: [],
        candidates: ['#home', 'li.item > a', 'ul a'],
        descriptions: { 'li.item > a': { role: 'similar' } },
      },
      { '#home': 1, 'li.item > a': 3, 'ul a': 3 }
    );

    expect(slots).toEqual({
      only: '#home',
      similar: 'li.item > a',
      all: undefined,
    });
  });

  it('leaves Similar out when its candidate reaches only the picked element', () => {
    const slots = slotsFor(
      {
        existing: [],
        candidates: ['li.item > a', 'a'],
        descriptions: { 'li.item > a': { role: 'similar' } },
      },
      { 'li.item > a': 1, a: 5 }
    );

    expect(slots).toEqual({
      only: 'li.item > a',
      similar: undefined,
      all: 'a',
    });
  });

  it("offers every account's avatar as Similar rather than one account's", () => {
    const one = 'div[data-testid="UserAvatar-Container-nasa"] img';
    const every = 'div[data-testid^="UserAvatar-Container-"] img';
    const slots = slotsFor(
      {
        existing: [],
        candidates: ['#avatar', one, every, 'img'],
        descriptions: {
          [one]: { role: 'similar' },
          [every]: { role: 'similar' },
          img: { role: 'all' },
        },
      },
      { '#avatar': 1, [one]: 4, [every]: 20, img: 60 }
    );

    expect(slots).toEqual({ only: '#avatar', similar: every, all: 'img' });
  });

  it("offers a named area's fallback as Similar when nothing nearer does", () => {
    const slots = slotsFor(
      {
        existing: [],
        candidates: ['#born', 'th.infobox-label', 'table.infobox th', 'th'],
        descriptions: {
          'th.infobox-label': { role: 'similar', fallback: true },
          'table.infobox th': { role: 'all', fallback: true },
          th: { role: 'all' },
        },
      },
      { '#born': 1, 'th.infobox-label': 12, 'table.infobox th': 16, th: 40 }
    );

    expect(slots).toEqual({
      only: '#born',
      similar: 'th.infobox-label',
      all: 'th',
    });
  });

  it('ignores a wider fallback when a nearer similar candidate fills Similar', () => {
    const slots = slotsFor(
      {
        existing: [],
        candidates: [
          '#story-3',
          'td.title > span.titleline > a',
          '#main td a',
          'a',
        ],
        descriptions: {
          'td.title > span.titleline > a': { role: 'similar' },
          '#main td a': { role: 'similar', fallback: true },
          a: { role: 'all' },
        },
      },
      {
        '#story-3': 1,
        'td.title > span.titleline > a': 30,
        '#main td a': 90,
        a: 200,
      }
    );

    expect(slots).toEqual({
      only: '#story-3',
      similar: 'td.title > span.titleline > a',
      all: 'a',
    });
  });

  it('offers the fallback as All only when nothing else reaches past Similar', () => {
    const alternatives = {
      existing: [],
      candidates: [
        '#mwOw',
        '#mwLA a',
        'div.mw-content-ltr > p > a',
        'div.mw-content-ltr a',
      ],
      descriptions: {
        '#mwLA a': { role: 'all' as const },
        'div.mw-content-ltr > p > a': {
          role: 'similar' as const,
          fallback: true,
        },
        'div.mw-content-ltr a': { role: 'all' as const, fallback: true },
      },
    };
    const counts = {
      '#mwOw': 1,
      '#mwLA a': 18,
      'div.mw-content-ltr > p > a': 900,
      'div.mw-content-ltr a': 1500,
    };

    expect(slotsFor(alternatives, counts)).toEqual({
      only: '#mwOw',
      similar: 'div.mw-content-ltr > p > a',
      all: 'div.mw-content-ltr a',
    });
  });

  it('offers the earliest, most stable candidate as All when two reach as far', () => {
    const slots = slotsFor(
      {
        existing: [],
        candidates: ['#login', '.card a', 'main a'],
      },
      { '#login': 1, '.card a': 20, 'main a': 20 }
    );

    expect(slots.all).toBe('.card a');
  });

  it('prefers a narrower non-fallback over a wider fallback for All', () => {
    const slots = slotsFor(
      {
        existing: [],
        candidates: ['#login', '.card a', 'main a'],
        descriptions: {
          '.card a': { role: 'all' },
          'main a': { role: 'all', fallback: true },
        },
      },
      { '#login': 1, '.card a': 4, 'main a': 20 }
    );

    expect(slots).toEqual({
      only: '#login',
      similar: undefined,
      all: '.card a',
    });
  });

  it('offers a saved rule that is the same spot in every block as Similar', () => {
    const saved = '.titleline > a';
    const replaces = 'tr.athing .titleline > a';

    expect(
      slotsFor(withSaved(saved, replaces), countsWithSaved(saved, replaces))
    ).toEqual({ only: '#story-3', similar: saved, all: 'td a' });
  });

  it('offers a saved rule that reaches what All would as All', () => {
    const saved = 'table a';

    expect(
      slotsFor(withSaved(saved, 'td a'), countsWithSaved(saved, 'td a'))
    ).toEqual({
      only: '#story-3',
      similar: 'tr.athing .titleline > a',
      all: saved,
    });
  });

  it('offers a saved rule for just the element as Only, however tied to the structure it is', () => {
    const saved = 'main > div > ul > li:nth-of-type(2) > a';

    expect(
      slotsFor(
        { existing: [saved], candidates: [saved, 'a'] },
        { [saved]: 1, a: 5 }
      )
    ).toEqual({ only: saved, similar: undefined, all: 'a' });
  });

  it('offers a saved rule as Similar over a wider similar suggestion', () => {
    const saved = '.titleline > a';

    expect(
      slotsFor(
        {
          existing: [saved],
          candidates: [saved, 'span.titleline a'],
          descriptions: {
            [saved]: { role: 'similar' },
            'span.titleline a': { role: 'similar' },
          },
        },
        { [saved]: 30, 'span.titleline a': 60 }
      ).similar
    ).toBe(saved);
  });
});

describe('getDefaultScope', () => {
  it('starts on a saved rule that fills Similar', () => {
    const saved = '.titleline > a';
    const replaces = 'tr.athing .titleline > a';

    expect(
      defaultScope(withSaved(saved, replaces), countsWithSaved(saved, replaces))
    ).toBe(saved);
  });

  it('starts on a saved rule that fills All, over Similar', () => {
    const saved = 'table a';

    expect(
      defaultScope(withSaved(saved, 'td a'), countsWithSaved(saved, 'td a'))
    ).toBe(saved);
  });

  it('starts on a saved rule for just the element, in Only', () => {
    const saved = 'tr:nth-of-type(3) .titleline > a';

    expect(
      defaultScope(
        withSaved(saved, '#story-3'),
        countsWithSaved(saved, '#story-3')
      )
    ).toBe(saved);
  });

  it('starts on Similar when it has one', () => {
    expect(defaultScope(TITLES, TITLE_COUNTS)).toBe('tr.athing .titleline > a');
  });

  it('starts on Only over an All that is not a fallback', () => {
    const scope = defaultScope(
      {
        existing: [],
        candidates: ['#mwOw', '#mwLA a'],
        descriptions: { '#mwLA a': { role: 'all' } },
      },
      { '#mwOw': 1, '#mwLA a': 18 }
    );

    expect(scope).toBe('#mwOw');
  });

  it('starts on All when there is no Similar or Only', () => {
    const scope = defaultScope(
      {
        existing: [],
        candidates: ['main > div > ul > li:nth-of-type(2) > a', '.nav a'],
        descriptions: { '.nav a': { role: 'all' } },
      },
      { 'main > div > ul > li:nth-of-type(2) > a': 1, '.nav a': 5 }
    );

    expect(scope).toBe('.nav a');
  });

  it('starts on Only over Similar and All fallbacks', () => {
    const scope = defaultScope(
      {
        existing: [],
        candidates: [
          '#mwOw',
          'div.mw-content-ltr > p > a',
          'div.mw-content-ltr a',
        ],
        descriptions: {
          'div.mw-content-ltr > p > a': { role: 'similar', fallback: true },
          'div.mw-content-ltr a': { role: 'all', fallback: true },
        },
      },
      {
        '#mwOw': 1,
        'div.mw-content-ltr > p > a': 900,
        'div.mw-content-ltr a': 1500,
      }
    );

    expect(scope).toBe('#mwOw');
  });

  it('starts on the Similar fallback when Only is hidden', () => {
    const scope = defaultScope(
      {
        existing: [],
        candidates: [
          'table > tbody > tr:nth-of-type(4) > th',
          'table.infobox th.infobox-label',
          'table.infobox th',
        ],
        descriptions: {
          'table.infobox th.infobox-label': { role: 'similar', fallback: true },
          'table.infobox th': { role: 'all', fallback: true },
        },
      },
      {
        'table > tbody > tr:nth-of-type(4) > th': 1,
        'table.infobox th.infobox-label': 12,
        'table.infobox th': 16,
      }
    );

    expect(scope).toBe('table.infobox th.infobox-label');
  });

  it('starts on the All fallback when it is the only scope', () => {
    const scope = defaultScope(
      {
        existing: [],
        candidates: ['table.infobox th'],
        descriptions: { 'table.infobox th': { role: 'all', fallback: true } },
      },
      { 'table.infobox th': 16 }
    );

    expect(scope).toBe('table.infobox th');
  });

  it('keeps the pick when there is no scope', () => {
    const scope = defaultScope(
      {
        existing: [],
        candidates: ['main > div > p:nth-of-type(2)'],
      },
      { 'main > div > p:nth-of-type(2)': 1 }
    );

    expect(scope).toBeUndefined();
  });
});
