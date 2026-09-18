import {
  getEligibility,
  markEligible,
  markIneligible,
} from '../eligibility-cache';

describe('eligibility-cache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should know nothing about a fresh url', () => {
    expect(getEligibility('https://theverge.com/tech/1/article')).toEqual({
      isKnownIneligible: false,
      matchesKnownPattern: false,
    });
  });

  it('should remember an exact url as ineligible once marked, across query/hash variants', () => {
    markIneligible('https://example.com/app?tab=1');

    expect(
      getEligibility('https://example.com/app?tab=2').isKnownIneligible
    ).toBe(true);
    expect(
      getEligibility('https://example.com/app#section').isKnownIneligible
    ).toBe(true);
    expect(getEligibility('https://example.com/other').isKnownIneligible).toBe(
      false
    );
  });

  it('should generalize a learned pattern to other urls under the same shape, wildcarding numeric segments', () => {
    markEligible(
      'https://theverge.com/tech/995079/president-donald-trump-calls-nvidia-ceo'
    );

    expect(
      getEligibility('https://theverge.com/tech/123456/some-other-story')
        .matchesKnownPattern
    ).toBe(true);
  });

  it('should not generalize across different path shapes on the same origin', () => {
    markEligible('https://theverge.com/tech/995079/some-article');

    expect(
      getEligibility('https://theverge.com/science/1/some-other-article')
        .matchesKnownPattern
    ).toBe(false);
  });

  it('should not generalize across origins', () => {
    markEligible('https://theverge.com/tech/995079/some-article');

    expect(
      getEligibility('https://example.com/tech/1/some-article')
        .matchesKnownPattern
    ).toBe(false);
  });

  it('should generalize wikipedia articles by their fixed /wiki/ prefix', () => {
    markEligible('https://en.wikipedia.org/wiki/Blue_Prince');

    expect(
      getEligibility('https://en.wikipedia.org/wiki/Some_Other_Article')
        .matchesKnownPattern
    ).toBe(true);
  });

  it('should generalize date-prefixed urls across different dates in the same section', () => {
    markEligible(
      'https://www.nytimes.com/2026/09/14/health/ai-doctors-medicare-fda.html'
    );

    expect(
      getEligibility(
        'https://www.nytimes.com/2027/01/02/health/some-other-headline.html'
      ).matchesKnownPattern
    ).toBe(true);
    expect(
      getEligibility(
        'https://www.nytimes.com/2027/01/02/technology/some-headline.html'
      ).matchesKnownPattern
    ).toBe(false);
  });

  it('should clear the ineligible record for a url once it is marked eligible', () => {
    markIneligible('https://example.com/app');
    markEligible('https://example.com/app');

    expect(getEligibility('https://example.com/app').isKnownIneligible).toBe(
      false
    );
  });

  it('should not throw when localStorage access fails', () => {
    const original = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('denied');
      },
    });

    const url = 'https://theverge.com/tech/1/article';

    expect(() => getEligibility(url)).not.toThrow();
    expect(() => markEligible(url)).not.toThrow();
    expect(() => markIneligible(url)).not.toThrow();
    expect(getEligibility(url)).toEqual({
      isKnownIneligible: false,
      matchesKnownPattern: false,
    });

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: original,
    });
  });
});
