import { getScopeSlots } from './selector-scopes';

describe('getScopeSlots', () => {
  it('offers the one-element candidate as Only and the pick as All when it reaches further', () => {
    const slots = getScopeSlots(
      {
        selector: '.card a',
        existing: [],
        candidates: ['#login', '.card a', 'a'],
      },
      { '#login': 1, '.card a': 4, a: 20 }
    );

    expect(slots).toEqual({
      only: '#login',
      similar: undefined,
      all: '.card a',
    });
  });

  it('offers the widest candidate as All when the pick matches one element', () => {
    const slots = getScopeSlots(
      {
        selector: '#login',
        existing: [],
        candidates: ['#login', '.card a', 'a'],
      },
      { '#login': 1, '.card a': 4, a: 20 }
    );

    expect(slots).toEqual({ only: '#login', similar: undefined, all: 'a' });
  });

  it('leaves Only out when the one-element candidate is too tied to the structure', () => {
    const slots = getScopeSlots(
      {
        selector: 'a',
        existing: [],
        candidates: ['main > div > ul > li:nth-of-type(2) > a', 'a'],
      },
      { 'main > div > ul > li:nth-of-type(2) > a': 1, a: 5 }
    );

    expect(slots).toEqual({ only: undefined, similar: undefined, all: 'a' });
  });

  it('leaves All out when nothing reaches more than one element', () => {
    const slots = getScopeSlots(
      { selector: 'h1', existing: [], candidates: ['h1'] },
      { h1: 1 }
    );

    expect(slots).toEqual({ only: 'h1', similar: undefined, all: undefined });
  });

  it('offers nothing before the counts arrive', () => {
    const slots = getScopeSlots(
      { selector: 'h1', existing: [], candidates: ['h1', 'body h1'] },
      {}
    );

    expect(slots).toEqual({
      only: undefined,
      similar: undefined,
      all: undefined,
    });
  });

  it('offers the widest similar candidate as Similar, and the pick as All when it reaches further', () => {
    const slots = getScopeSlots(
      {
        selector: 'a',
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

  it('offers a wider candidate as All when the pick is the similar one', () => {
    const slots = getScopeSlots(
      {
        selector: 'td.title > span.titleline > a',
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
    const slots = getScopeSlots(
      {
        selector: 'li.item > a',
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
    const slots = getScopeSlots(
      {
        selector: 'a',
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
    const slots = getScopeSlots(
      {
        selector: 'img',
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
    const slots = getScopeSlots(
      {
        selector: 'th.infobox-label',
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
    const slots = getScopeSlots(
      {
        selector: 'a',
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
      selector: '#mwOw',
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

    expect(getScopeSlots(alternatives, counts)).toEqual({
      only: '#mwOw',
      similar: 'div.mw-content-ltr > p > a',
      all: 'div.mw-content-ltr a',
    });
  });

  it('keeps the pick as All over a wider fallback', () => {
    const slots = getScopeSlots(
      {
        selector: '.card a',
        existing: [],
        candidates: ['#login', '.card a', 'main a'],
        descriptions: { 'main a': { role: 'all', fallback: true } },
      },
      { '#login': 1, '.card a': 4, 'main a': 20 }
    );

    expect(slots).toEqual({
      only: '#login',
      similar: undefined,
      all: '.card a',
    });
  });

  it('prefers a narrower non-fallback over a wider fallback for All', () => {
    const slots = getScopeSlots(
      {
        selector: '#login',
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

  it('offers the saved rule as Styled, and not again as All', () => {
    const slots = getScopeSlots(
      {
        selector: '.titleline > a',
        existing: ['.titleline > a'],
        styled: '.titleline > a',
        candidates: ['#story-3', '.titleline a', 'a'],
        descriptions: { '.titleline a': { role: 'similar' } },
      },
      { '.titleline > a': 30, '#story-3': 1, '.titleline a': 60, a: 200 }
    );

    expect(slots).toEqual({
      styled: '.titleline > a',
      only: '#story-3',
      similar: '.titleline a',
      all: 'a',
    });
  });

  it('offers a saved rule as Styled however tied to the structure it is', () => {
    const saved = 'main > div > ul > li:nth-of-type(2) > a';
    const slots = getScopeSlots(
      {
        selector: saved,
        existing: [saved],
        styled: saved,
        candidates: ['a'],
      },
      { [saved]: 1, a: 5 }
    );

    expect(slots).toEqual({
      styled: saved,
      only: undefined,
      similar: undefined,
      all: 'a',
    });
  });

  it('leaves Similar to the Styled rule when it is the same spot in every block', () => {
    const slots = getScopeSlots(
      {
        selector: 'span.titleline a',
        existing: ['.titleline > a'],
        styled: '.titleline > a',
        candidates: ['span.titleline a'],
        descriptions: {
          '.titleline > a': { role: 'similar' },
          'span.titleline a': { role: 'similar', fallback: true },
        },
      },
      { '.titleline > a': 30, 'span.titleline a': 60 }
    );

    expect(slots).toEqual({
      styled: '.titleline > a',
      only: undefined,
      similar: undefined,
      all: 'span.titleline a',
    });
  });
});
