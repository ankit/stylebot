import BackgroundPageUtils from '../utils';

describe('matchesUrl', () => {
  const matchesUrl = BackgroundPageUtils['matchesUrl'].bind(
    BackgroundPageUtils
  );

  describe('matches', () => {
    it('is true for exact matching domains', () => {
      expect(matchesUrl('https://example.com', 'example.com')).toBe(true);
    });

    it('is true for matching subdomain', () => {
      expect(matchesUrl('https://www.example.com', 'example.com')).toBe(true);
    });

    it('is true for full match on top-level domain', () => {
      expect(matchesUrl('https://www.example.co.uk', 'example.co.uk')).toBe(
        true
      );
    });

    it('is true for any port if port unspecified', () => {
      expect(matchesUrl('http://localhost:5000', 'localhost')).toBe(true);
    });

    it('is true when port specified and matches', () => {
      expect(matchesUrl('http://localhost:5000', 'localhost:5000')).toBe(true);
    });

    it('is true when protocol specified', () => {
      expect(matchesUrl('file:///a/b/c.gif', 'file:///a/b/c.gif')).toBe(true);
    });

    it('is true when unknown query params in page url', () => {
      expect(
        matchesUrl('https://example.com/?q=p&unknown=true', 'example.com/?q=p')
      ).toBe(true);
    });

    it('is true with no url parts specified', () => {
      expect(
        matchesUrl(
          'https://user:pass@www.example.com:8080/path?q=p#hash',
          'example.com'
        )
      ).toBe(true);
    });

    it('is true with all url parts specified', () => {
      expect(
        matchesUrl(
          'https://user:pass@www.example.com:8080/path?q=p#hash',
          'https://user:pass@www.example.com:8080/path?q=p#hash'
        )
      ).toBe(true);
    });

    it('matches strictly', () => {
      expect(
        matchesUrl('https://www.example.com/path', 'https://www.example.com/')
      ).toBe(true);
    });
  });

  describe('non-matches', () => {
    it('is false for empty inputs', () => {
      expect(matchesUrl('', '')).toBe(false);
    });

    it('is false for empty page url', () => {
      expect(matchesUrl('', 'example.com')).toBe(false);
    });

    it('is false for empty url', () => {
      expect(matchesUrl('https://example.com', '')).toBe(false);
    });

    it('is false for malformed page url', () => {
      expect(matchesUrl('https:////', 'example.com')).toBe(false);
    });

    it('is false for malformed url', () => {
      expect(matchesUrl('https://example.com', '//')).toBe(false);
    });

    it('is false when domain appears outside hostname', () => {
      expect(
        matchesUrl(
          'https://web.archive.org/web/*/https://www.example.com/',
          'www.example.com'
        )
      ).toBe(false);
    });

    it('is false for partial match on top-level domain', () => {
      expect(matchesUrl('https://www.example.co.uk', 'example.co')).toBe(false);
    });

    it('is false for partial match on top-level domain #2', () => {
      expect(matchesUrl('https://www.example.co', 'example.co.uk')).toBe(false);
    });

    it('is false where subUrl is more specific than url', () => {
      expect(matchesUrl('https://example.com', 'www.example.com')).toBe(false);
    });

    it('is false for partial subdomain match', () => {
      expect(matchesUrl('https://wwwexample.com', 'example.com')).toBe(false);
    });

    it('is false on protocol mismatch when protocol specified', () => {
      expect(matchesUrl('http://example.com/', 'https://example.com/')).toBe(
        false
      );
    });

    it('is false on port mismatch', () => {
      expect(matchesUrl('http://localhost:5000', 'localhost:3000')).toBe(false);
    });

    it('is false on hash mismatch', () => {
      expect(matchesUrl('http://example.com/#wrong', 'example.com/#hash')).toBe(
        false
      );
    });

    it('is false on pathname mismatch', () => {
      expect(matchesUrl('http://example.com/wrong', 'example.com/path')).toBe(
        false
      );
    });

    it('is false on query param mismatch', () => {
      expect(matchesUrl('example.com/q=false', 'example.com/q=true')).toBe(
        false
      );
    });

    it('uses strict matching of hostname if protocol specified', () => {
      expect(
        matchesUrl('https://example.com/', 'https://www.example.com/')
      ).toBe(false);
    });

    it('uses strict matching of hostname if pathname specified', () => {
      expect(
        matchesUrl('https://example.com/path', 'www.example.com/path')
      ).toBe(false);
    });
  });
});

describe('matchesWildcard', () => {
  const matchesWildcard = BackgroundPageUtils['matchesWildcard'].bind(
    BackgroundPageUtils
  );

  describe('**', () => {
    it('matches at the end of url', () => {
      expect(
        matchesWildcard(
          'https://github.com/ankit/stylebot',
          'https://github.com/**'
        )
      ).toBe(true);
    });

    it('matches in the middle of url', () => {
      expect(
        matchesWildcard(
          'https://github.com/ankit/stylebot',
          'https://github.com/**/stylebot'
        )
      ).toBe(true);
    });

    it('matches in the beginning of url', () => {
      expect(
        matchesWildcard('https://github.com/ankit/stylebot', '**/stylebot')
      ).toBe(true);
    });

    it('matches without protocol', () => {
      expect(
        matchesWildcard('http://news.ycombinator.com', '**ycombinator.com')
      ).toBe(true);
    });

    it('non-matching url', () => {
      expect(
        matchesWildcard('http://news.ycombinator.com', '**apps.ycombinator.com')
      ).toBe(false);
    });

    it('non-matching protocol', () => {
      expect(
        matchesWildcard(
          'http://news.ycombinator.com',
          'https://**.ycombinator.com'
        )
      ).toBe(false);
    });
  });

  describe('*', () => {
    it('matches at the end of url', () => {
      expect(
        matchesWildcard(
          'https://github.com/ankit/stylebot',
          'https://github.com/*/stylebot'
        )
      ).toBe(true);
    });

    it('matches in the middle of url', () => {
      expect(
        matchesWildcard(
          'https://github.com/ankit/stylebot',
          'https://github.com/*/stylebot'
        )
      ).toBe(true);

      expect(
        matchesWildcard('https://docs1.google.com', 'doc*.google.com')
      ).toBe(true);
    });

    it('matches in the beginning of url', () => {
      expect(
        matchesWildcard(
          'https://github.com/ankit/stylebot',
          '*github.com/*/stylebot'
        )
      ).toBe(true);
    });

    it('matches without protocol', () => {
      expect(
        matchesWildcard('http://news.ycombinator.com', '*.ycombinator.com')
      ).toBe(true);
    });

    it('non-matching url', () => {
      expect(
        matchesWildcard('https://docs1.google.com', 'docs2*.google.com')
      ).toBe(false);
    });

    it('non-matching protocol', () => {
      expect(
        matchesWildcard('https://docs1.google.com', 'http://docs*.google.com')
      ).toBe(false);
    });
  });
});
