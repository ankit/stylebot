import {
  blobToDataUrl,
  dataUrlToBlob,
  getStyleUrlPattern,
  getStyleSite,
  hashCss,
  isPublicSite,
  toGallerySite,
} from './utils';

const PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgo=';

describe('data URLs', () => {
  it('round-trip a blob', async () => {
    const blob = dataUrlToBlob(PNG_DATA_URL);

    expect(blob.type).toBe('image/png');
    expect(await blobToDataUrl(blob)).toBe(PNG_DATA_URL);
  });
});

describe('toGallerySite', () => {
  it('keeps a bare hostname without www', () => {
    expect(toGallerySite(' WWW.GitHub.com ')).toBe('github.com');
    expect(toGallerySite('docs.python.org')).toBe('docs.python.org');
  });
});

describe('saved style urls', () => {
  it('reads the site from the first hostname in a key, without www', () => {
    expect(getStyleSite('github.com')).toBe('github.com');
    expect(getStyleSite('www.GitHub.com/ankit')).toBe('github.com');
    expect(getStyleSite('^https://chatgpt\\.com/(?!codex)')).toBe(
      'chatgpt.com'
    );
    expect(getStyleSite('*.wikipedia.org/wiki/*')).toBe('wikipedia.org');
    expect(getStyleSite('*')).toBe('*');
  });

  it('has a pattern for any key but a plain hostname', () => {
    expect(getStyleUrlPattern('github.com')).toBeNull();
    expect(getStyleUrlPattern('docs.python.org')).toBeNull();
    expect(getStyleUrlPattern('github.com/ankit')).toBe('github.com/ankit');
    expect(getStyleUrlPattern('*.github.com')).toBe('*.github.com');
    expect(getStyleUrlPattern('^https://chatgpt\\.com/')).toBe(
      '^https://chatgpt\\.com/'
    );
  });
});

describe('isPublicSite', () => {
  const isPublic = (url: string) => isPublicSite(new URL(url));

  it('takes websites on the web', () => {
    expect(isPublic('https://github.com/ankit')).toBe(true);
    expect(isPublic('http://news.ycombinator.com/')).toBe(true);
  });

  it('leaves out local and internal addresses', () => {
    expect(isPublic('http://localhost/')).toBe(false);
    expect(isPublic('http://intranet/')).toBe(false);
    expect(isPublic('http://10.0.0.8/')).toBe(false);
    expect(isPublic('http://[::1]/')).toBe(false);
    expect(isPublic('https://printer.local/')).toBe(false);
    expect(isPublic('https://jira.acme.corp/')).toBe(false);
    expect(isPublic('https://app.test/')).toBe(false);
    expect(isPublic('https://github.com:8443/')).toBe(false);
    expect(isPublic('file:///Users/me/page.html')).toBe(false);
  });
});

describe('hashCss', () => {
  it('changes with the CSS and only with it', () => {
    expect(hashCss('a { color: red; }')).toBe(hashCss('a { color: red; }'));
    expect(hashCss('a { color: red; }')).not.toBe(
      hashCss('a { color: blue; }')
    );
  });

  it('ignores whitespace around the CSS', () => {
    expect(hashCss('\na { color: red; }\n')).toBe(hashCss('a { color: red; }'));
  });
});
