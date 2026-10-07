import { removeFontImports } from './chat-fonts';

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
