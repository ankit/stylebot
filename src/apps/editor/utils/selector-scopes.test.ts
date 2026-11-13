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
});
