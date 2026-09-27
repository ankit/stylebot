import { resolveGoogleFont } from '@stylebot/google-fonts';

import { addFontImports, removeFontImports } from './chat-fonts';

jest.mock('@stylebot/google-fonts', () => ({
  resolveGoogleFont: jest.fn(async (family: string) =>
    family === 'Inter' ? 'Inter' : null
  ),
}));

const fontEdit = (value: string) => [
  { selector: 'h1', declarations: [{ property: 'font-family', value }] },
];

describe('addFontImports', () => {
  beforeEach(() => jest.mocked(resolveGoogleFont).mockClear());

  it('imports a Google font the edits name', async () => {
    const css = 'h1 { font-family: Inter; }';

    expect(await addFontImports(css, fontEdit('Inter'))).toContain(
      '@import url(https://fonts.googleapis.com/css2?family=Inter:'
    );
  });

  it('leaves the css alone for fonts that are not on Google Fonts', async () => {
    const css = 'h1 { font-family: Georgia; }';

    expect(await addFontImports(css, fontEdit('Georgia'))).toBe(css);
  });

  it('skips the lookup when no edit sets a font', async () => {
    const css = 'h1 { color: red; }';
    const edits = [
      { selector: 'h1', declarations: [{ property: 'color', value: 'red' }] },
    ];

    expect(await addFontImports(css, edits)).toBe(css);
    expect(resolveGoogleFont).not.toHaveBeenCalled();
  });
});

describe('removeFontImports', () => {
  const imported =
    '@import url(https://fonts.googleapis.com/css2?family=Inter&display=swap);\nh1 { font-family: Georgia; }';

  it('drops imports no longer used once a font is put back', () => {
    const css = removeFontImports(imported, [
      { selector: 'h1', property: 'font-family', value: 'Georgia' },
    ]);

    expect(css).not.toContain('@import');
    expect(css).toContain('font-family: Georgia');
  });

  it('leaves the css alone when no font was put back', () => {
    expect(
      removeFontImports(imported, [
        { selector: 'h1', property: 'color', value: 'red' },
      ])
    ).toBe(imported);
  });
});
