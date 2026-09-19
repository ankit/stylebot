import { GoogleFont } from '../fonts';
import { suggestFonts } from '../suggest';

const google: Array<GoogleFont> = [
  { family: 'Roboto', category: 'sans-serif' },
  { family: 'Playfair Display', category: 'serif' },
  { family: 'Lora', category: 'serif' },
  { family: 'Playfair', category: 'serif' },
];

const recents = ['Inter', 'Lora', 'Georgia'];

describe('suggestFonts', () => {
  it('lists the default and recents while the text is untouched', () => {
    const rows = suggestFonts('Inter', 'Inter', recents, google);

    expect(rows.map(row => row.kind)).toEqual([
      'default',
      'font',
      'font',
      'font',
    ]);
    expect(rows[2]).toEqual({
      kind: 'font',
      family: 'Lora',
      value: 'Lora',
      category: 'serif',
    });
    expect(rows[3]).toMatchObject({ family: 'Georgia', category: undefined });
  });

  it('leaves a single multi-word family unquoted', () => {
    expect(suggestFonts('', '', ['Playfair Display'], google)[1]).toMatchObject(
      { value: 'Playfair Display' }
    );
    expect(suggestFonts('playf', '', [], google)[0]).toMatchObject({
      value: 'Playfair Display',
    });
  });

  it('completes the typed family from recents first, then Google Fonts', () => {
    const rows = suggestFonts('lo', '', recents, google);

    expect(rows).toEqual([
      { kind: 'font', family: 'Lora', value: 'Lora', category: 'serif' },
      { kind: 'custom', value: 'lo' },
    ]);
  });

  it('completes only the last segment of a stack', () => {
    const rows = suggestFonts('Inter, playf', 'Inter', [], google);

    expect(rows[0]).toMatchObject({
      family: 'Playfair Display',
      value: 'Inter, "Playfair Display"',
    });
    expect(rows[1]).toMatchObject({ family: 'Playfair' });
  });

  it('offers the raw text unless a row already produces it', () => {
    expect(suggestFonts('Some Local', '', recents, google)).toEqual([
      { kind: 'custom', value: 'Some Local' },
    ]);
    expect(
      suggestFonts('lora', '', recents, google).map(row => row.kind)
    ).toEqual(['font']);
  });
});
