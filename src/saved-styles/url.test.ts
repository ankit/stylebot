import { isHtmlUrl, isSupportedUrl, matchesUrlPattern } from './url';

describe('matchesUrlPattern with urls', () => {
  describe('matches', () => {
    it('is true for exact matching domains', () => {
      expect(matchesUrlPattern('https://example.com', 'example.com')).toBe(
        true
      );
    });

    it('is true for matching subdomain', () => {
      expect(matchesUrlPattern('https://www.example.com', 'example.com')).toBe(
        true
      );
    });

    it('is true for full match on top-level domain', () => {
      expect(
        matchesUrlPattern('https://www.example.co.uk', 'example.co.uk')
      ).toBe(true);
    });

    it('is true for any port if port unspecified', () => {
      expect(matchesUrlPattern('http://localhost:5000', 'localhost')).toBe(
        true
      );
    });

    it('is true when port specified and matches', () => {
      expect(matchesUrlPattern('http://localhost:5000', 'localhost:5000')).toBe(
        true
      );
    });

    it('is true when protocol specified', () => {
      expect(matchesUrlPattern('file:///a/b/c.gif', 'file:///a/b/c.gif')).toBe(
        true
      );
    });

    it('is true when unknown query params in page url', () => {
      expect(
        matchesUrlPattern(
          'https://example.com/?q=p&unknown=true',
          'example.com/?q=p'
        )
      ).toBe(true);
    });

    it('is true with no url parts specified', () => {
      expect(
        matchesUrlPattern(
          'https://user:pass@www.example.com:8080/path?q=p#hash',
          'example.com'
        )
      ).toBe(true);
    });

    it('is true with all url parts specified', () => {
      expect(
        matchesUrlPattern(
          'https://user:pass@www.example.com:8080/path?q=p#hash',
          'https://user:pass@www.example.com:8080/path?q=p#hash'
        )
      ).toBe(true);
    });

    it('matches strictly', () => {
      expect(
        matchesUrlPattern(
          'https://www.example.com/path',
          'https://www.example.com/'
        )
      ).toBe(true);
    });
  });

  describe('non-matches', () => {
    it('is false for empty inputs', () => {
      expect(matchesUrlPattern('', '')).toBe(false);
    });

    it('is false for empty page url', () => {
      expect(matchesUrlPattern('', 'example.com')).toBe(false);
    });

    it('is false for empty url', () => {
      expect(matchesUrlPattern('https://example.com', '')).toBe(false);
    });

    it('is false for malformed page url', () => {
      expect(matchesUrlPattern('https:////', 'example.com')).toBe(false);
    });

    it('is false for malformed url', () => {
      expect(matchesUrlPattern('https://example.com', '//')).toBe(false);
    });

    it('is false when domain appears outside hostname', () => {
      expect(
        matchesUrlPattern(
          'https://web.archive.org/web/*/https://www.example.com/',
          'www.example.com'
        )
      ).toBe(false);
    });

    it('is false for partial match on top-level domain', () => {
      expect(matchesUrlPattern('https://www.example.co.uk', 'example.co')).toBe(
        false
      );
    });

    it('is false for partial match on top-level domain #2', () => {
      expect(matchesUrlPattern('https://www.example.co', 'example.co.uk')).toBe(
        false
      );
    });

    it('is false where subUrl is more specific than url', () => {
      expect(matchesUrlPattern('https://example.com', 'www.example.com')).toBe(
        false
      );
    });

    it('is false for partial subdomain match', () => {
      expect(matchesUrlPattern('https://wwwexample.com', 'example.com')).toBe(
        false
      );
    });

    it('is false on protocol mismatch when protocol specified', () => {
      expect(
        matchesUrlPattern('http://example.com/', 'https://example.com/')
      ).toBe(false);
    });

    it('is false on port mismatch', () => {
      expect(matchesUrlPattern('http://localhost:5000', 'localhost:3000')).toBe(
        false
      );
    });

    it('is false on hash mismatch', () => {
      expect(
        matchesUrlPattern('http://example.com/#wrong', 'example.com/#hash')
      ).toBe(false);
    });

    it('is false on pathname mismatch', () => {
      expect(
        matchesUrlPattern('http://example.com/wrong', 'example.com/path')
      ).toBe(false);
    });

    it('is false on query param mismatch', () => {
      expect(
        matchesUrlPattern('example.com/q=false', 'example.com/q=true')
      ).toBe(false);
    });

    it('uses strict matching of hostname if protocol specified', () => {
      expect(
        matchesUrlPattern('https://example.com/', 'https://www.example.com/')
      ).toBe(false);
    });

    it('uses strict matching of hostname if pathname specified', () => {
      expect(
        matchesUrlPattern('https://example.com/path', 'www.example.com/path')
      ).toBe(false);
    });
  });
});

describe('matchesUrlPattern with wildcards', () => {
  describe('**', () => {
    it('matches at the end of url', () => {
      expect(
        matchesUrlPattern(
          'https://github.com/ankit/stylebot',
          'https://github.com/**'
        )
      ).toBe(true);
    });

    it('matches in the middle of url', () => {
      expect(
        matchesUrlPattern(
          'https://github.com/ankit/stylebot',
          'https://github.com/**/stylebot'
        )
      ).toBe(true);
    });

    it('matches in the beginning of url', () => {
      expect(
        matchesUrlPattern('https://github.com/ankit/stylebot', '**/stylebot')
      ).toBe(true);
    });

    it('matches without protocol', () => {
      expect(
        matchesUrlPattern('http://news.ycombinator.com', '**ycombinator.com')
      ).toBe(true);
    });

    it('non-matching url', () => {
      expect(
        matchesUrlPattern(
          'http://news.ycombinator.com',
          '**apps.ycombinator.com'
        )
      ).toBe(false);
    });

    it('non-matching protocol', () => {
      expect(
        matchesUrlPattern(
          'http://news.ycombinator.com',
          'https://**.ycombinator.com'
        )
      ).toBe(false);
    });
  });

  describe('*', () => {
    it('matches at the end of url', () => {
      expect(
        matchesUrlPattern(
          'https://github.com/ankit/stylebot',
          'https://github.com/*/stylebot'
        )
      ).toBe(true);
    });

    it('matches in the middle of url', () => {
      expect(
        matchesUrlPattern(
          'https://github.com/ankit/stylebot',
          'https://github.com/*/stylebot'
        )
      ).toBe(true);

      expect(
        matchesUrlPattern('https://docs1.google.com', 'doc*.google.com')
      ).toBe(true);
    });

    it('matches in the beginning of url', () => {
      expect(
        matchesUrlPattern(
          'https://github.com/ankit/stylebot',
          '*github.com/*/stylebot'
        )
      ).toBe(true);
    });

    it('matches without protocol', () => {
      expect(
        matchesUrlPattern('http://news.ycombinator.com', '*.ycombinator.com')
      ).toBe(true);
    });

    it('non-matching url', () => {
      expect(
        matchesUrlPattern('https://docs1.google.com', 'docs2*.google.com')
      ).toBe(false);
    });

    it('non-matching protocol', () => {
      expect(
        matchesUrlPattern('https://docs1.google.com', 'http://docs*.google.com')
      ).toBe(false);
    });
  });
});

describe('isHtmlUrl', () => {
  it('is true for pages', () => {
    expect(isHtmlUrl('https://example.com/docs/index.html')).toBe(true);
  });

  it('is false for pdf, json and xml files', () => {
    expect(isHtmlUrl('https://example.com/report.pdf')).toBe(false);
    expect(isHtmlUrl('https://example.com/data.json')).toBe(false);
    expect(isHtmlUrl('https://example.com/feed.xml')).toBe(false);
  });
});

describe('isSupportedUrl', () => {
  it('is true for web pages', () => {
    expect(isSupportedUrl('https://github.com/ankit/stylebot')).toBe(true);
  });

  it('is false for browser and extension pages', () => {
    expect(isSupportedUrl('chrome://extensions')).toBe(false);
    expect(isSupportedUrl('chrome-extension://abc/options.html')).toBe(false);
    expect(isSupportedUrl('https://chrome.google.com/webstore/detail')).toBe(
      false
    );
  });

  it('is false for files that are not html', () => {
    expect(isSupportedUrl('https://example.com/report.pdf')).toBe(false);
  });
});
