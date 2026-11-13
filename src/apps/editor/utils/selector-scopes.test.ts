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

    expect(slots).toEqual({ only: '#login', all: '.card a' });
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

    expect(slots).toEqual({ only: '#login', all: 'a' });
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

    expect(slots).toEqual({ only: undefined, all: 'a' });
  });

  it('leaves All out when nothing reaches more than one element', () => {
    const slots = getScopeSlots(
      { selector: 'h1', existing: [], candidates: ['h1'] },
      { h1: 1 }
    );

    expect(slots).toEqual({ only: 'h1', all: undefined });
  });

  it('offers nothing before the counts arrive', () => {
    const slots = getScopeSlots(
      { selector: 'h1', existing: [], candidates: ['h1', 'body h1'] },
      {}
    );

    expect(slots).toEqual({ only: undefined, all: undefined });
  });
});
