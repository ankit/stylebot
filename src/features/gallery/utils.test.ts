import { blobToDataUrl, dataUrlToBlob, hashCss, toGallerySite } from './utils';

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

describe('hashCss', () => {
  it('changes with the CSS and only with it', () => {
    expect(hashCss('a { color: red; }')).toBe(hashCss('a { color: red; }'));
    expect(hashCss('a { color: red; }')).not.toBe(
      hashCss('a { color: blue; }')
    );
  });
});
