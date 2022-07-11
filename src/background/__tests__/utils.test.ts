import BackgroundPageUtils from '../utils';

describe('matchesHostname', () => {
  const matchesSubUrl = BackgroundPageUtils['matchesSubUrl'].bind(
    BackgroundPageUtils
  );

  describe('matches', () => {
    it('is true for exact matching domains', () => {
      expect(matchesSubUrl('https://example.com', 'example.com')).toBe(true);
    });

    it('is true for matching subdomain', () => {
      expect(matchesSubUrl('https://www.example.com', 'example.com')).toBe(
        true
      );
    });

    it('is true for full match on top-level domain', () => {
      expect(matchesSubUrl('https://www.example.co.uk', 'example.co.uk')).toBe(
        true
      );
    });

    it('is true for any port if port unspecified', () => {
      expect(matchesSubUrl('http://localhost:5000', 'localhost')).toBe(true);
    });

    it('is true when port specified and matches', () => {
      expect(matchesSubUrl('http://localhost:5000', 'localhost:5000')).toBe(
        true
      );
    });

    it('is true when protocol specified', () => {
      expect(matchesSubUrl('file:///a/b/c.gif', 'file:///a/b/c.gif')).toBe(
        true
      );
    });

    it('is true when unknown query params in page url', () => {
      expect(
        matchesSubUrl(
          'https://example.com/?q=p&unknown=true',
          'example.com/?q=p'
        )
      ).toBe(true);
    });

    it('is true with all `url` parts and no `subUrl` parts specified', () => {
      expect(
        matchesSubUrl(
          'https://user:pass@www.example.com:8080/path?q=p#hash',
          'example.com'
        )
      ).toBe(true);
    });

    it('is true with all `url` parts and all `subUrl` parts specified', () => {
      expect(
        matchesSubUrl(
          'https://user:pass@www.example.com:8080/path?q=p#hash',
          'https://user:pass@www.example.com:8080/path?q=p#hash'
        )
      ).toBe(true);
    });

    it('matches strictly', () => {
      expect(
        matchesSubUrl(
          'https://www.example.com/path',
          'https://www.example.com/'
        )
      ).toBe(true);
    });
  });

  describe('non-matches', () => {
    it('is false for empty inputs', () => {
      expect(matchesSubUrl('', '')).toBe(false);
    });

    it('is false for empty `url`', () => {
      expect(matchesSubUrl('', 'example.com')).toBe(false);
    });

    it('is false for empty `subUrl`', () => {
      expect(matchesSubUrl('https://example.com', '')).toBe(false);
    });

    it('is false for malformed `url`', () => {
      expect(matchesSubUrl('https:////', 'example.com')).toBe(false);
    });

    it('is false for malformed `subUrl`', () => {
      expect(matchesSubUrl('https://example.com', '//')).toBe(false);
    });

    it('is false where domain appears outside hostname', () => {
      expect(
        matchesSubUrl(
          'https://web.archive.org/web/*/https://www.example.com/',
          'www.example.com'
        )
      ).toBe(false);
    });

    it('is false for partial match on top-level domain', () => {
      expect(matchesSubUrl('https://www.example.co.uk', 'example.co')).toBe(
        false
      );
    });

    it('is false for partial match on top-level domain #2', () => {
      expect(matchesSubUrl('https://www.example.co', 'example.co.uk')).toBe(
        false
      );
    });

    it('is false where subUrl is more specific than url', () => {
      expect(matchesSubUrl('https://example.com', 'www.example.com')).toBe(
        false
      );
    });

    it('is false for partial subdomain match', () => {
      expect(matchesSubUrl('https://wwwexample.com', 'example.com')).toBe(
        false
      );
    });

    it('is false on protocol mismatch when protocol specified', () => {
      expect(matchesSubUrl('http://example.com/', 'https://example.com/')).toBe(
        false
      );
    });

    it('is false on port mismatch', () => {
      expect(matchesSubUrl('http://localhost:5000', 'localhost:3000')).toBe(
        false
      );
    });

    it('is false on hash mismatch', () => {
      expect(
        matchesSubUrl('http://example.com/#wrong', 'example.com/#hash')
      ).toBe(false);
    });

    it('is false on pathname mismatch', () => {
      expect(
        matchesSubUrl('http://example.com/wrong', 'example.com/path')
      ).toBe(false);
    });

    it('is false on query param mismatch', () => {
      expect(matchesSubUrl('example.com/q=false', 'example.com/q=true')).toBe(
        false
      );
    });

    it('uses strict matching of hostname if protocol specified', () => {
      expect(
        matchesSubUrl('https://example.com/', 'https://www.example.com/')
      ).toBe(false);
    });

    it('uses strict matching of hostname if pathname specified', () => {
      expect(
        matchesSubUrl('https://example.com/path', 'www.example.com/path')
      ).toBe(false);
    });
  });
});
