import { resolveGoogleFont } from './fonts';
import { addGoogleFontImports } from './imports';

jest.mock('./fonts', () => ({
  resolveGoogleFont: jest.fn(async (family: string) =>
    family === 'Inter' ? 'Inter' : null
  ),
}));

const fontEdit = (value: string) => [
  { selector: 'h1', declarations: [{ property: 'font-family', value }] },
];

describe('addGoogleFontImports', () => {
  beforeEach(() => jest.mocked(resolveGoogleFont).mockClear());

  it('imports a Google font the edits name', async () => {
    const css = 'h1 { font-family: Inter; }';

    expect(await addGoogleFontImports(css, fontEdit('Inter'))).toContain(
      '@import url(https://fonts.googleapis.com/css2?family=Inter:'
    );
  });

  it('imports a Google font set through a font variable', async () => {
    const css = ':root { --fontStack-sansSerif: Inter; }';
    const edits = [
      {
        selector: ':root',
        declarations: [{ property: '--fontStack-sansSerif', value: 'Inter' }],
      },
    ];

    expect(await addGoogleFontImports(css, edits)).toContain(
      '@import url(https://fonts.googleapis.com/css2?family=Inter:'
    );
  });

  it('leaves the css alone for fonts that are not on Google Fonts', async () => {
    const css = 'h1 { font-family: Georgia; }';

    expect(await addGoogleFontImports(css, fontEdit('Georgia'))).toBe(css);
  });

  it('skips the lookup when no edit sets a font', async () => {
    const css = 'h1 { color: red; }';
    const edits = [
      { selector: 'h1', declarations: [{ property: 'color', value: 'red' }] },
    ];

    expect(await addGoogleFontImports(css, edits)).toBe(css);
    expect(resolveGoogleFont).not.toHaveBeenCalled();
  });
});
