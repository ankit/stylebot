import type { GoogleFont } from './fonts';
import type { FontHeading } from './menu';
import { allFonts, categoryFonts, groupFontRows } from './menu';
import type { FontSuggestion } from './suggest';

const google: Array<GoogleFont> = [
  { family: 'Roboto', category: 'sans-serif' },
  { family: 'Lora', category: 'serif' },
  { family: 'Roboto Mono', category: 'monospace' },
  { family: 'Open Sans', category: 'sans-serif' },
  { family: 'Merriweather', category: 'serif' },
  { family: 'Lato', category: 'sans-serif' },
];

const labels = { recent: 'Recent', google: 'Google Fonts' };

const font = (family: string): FontSuggestion => ({
  kind: 'font',
  family,
  value: family,
});

const shape = (rows: Array<FontSuggestion | FontHeading>) =>
  rows.map(row => {
    if (row.kind === 'heading') {
      return `# ${row.label}`;
    }

    return row.kind === 'font' ? row.family : row.kind;
  });

describe('allFonts', () => {
  it('leads with sans and serif alternating, then the rest by popularity', () => {
    expect(allFonts(google, []).map(row => row.family)).toEqual([
      'Roboto',
      'Lora',
      'Open Sans',
      'Merriweather',
      'Lato',
      'Roboto Mono',
    ]);
  });

  it('skips fonts already among the recents, ignoring case', () => {
    expect(allFonts(google, ['lora', 'LATO']).map(row => row.family)).toEqual([
      'Roboto',
      'Merriweather',
      'Open Sans',
      'Roboto Mono',
    ]);
  });

  it('returns rows the picker can apply', () => {
    expect(allFonts(google, [])[0]).toEqual({
      kind: 'font',
      family: 'Roboto',
      value: 'Roboto',
      category: 'sans-serif',
    });
  });
});

describe('categoryFonts', () => {
  it("lists the category's fonts by category, not name, most popular first", () => {
    expect(categoryFonts('sans-serif', google).map(row => row.family)).toEqual([
      'Roboto',
      'Open Sans',
      'Lato',
    ]);
    expect(categoryFonts('serif', google)[0]).toEqual({
      kind: 'font',
      family: 'Lora',
      value: 'Lora',
      category: 'serif',
    });
  });
});

describe('groupFontRows', () => {
  it('puts the default first and the typed text last', () => {
    const rows: Array<FontSuggestion> = [
      { kind: 'custom', value: 'lo' },
      font('Lora'),
      { kind: 'default', value: '' },
    ];

    expect(shape(groupFontRows(rows, [], labels))).toEqual([
      'default',
      '# Google Fonts',
      'Lora',
      'custom',
    ]);
  });

  it('gathers interleaved fonts under one heading each, keeping their order', () => {
    const rows = ['Lora', 'Roboto', 'Inter', 'Merriweather'].map(font);

    expect(shape(groupFontRows(rows, ['Inter', 'lora'], labels))).toEqual([
      '# Recent',
      'Lora',
      'Inter',
      '# Google Fonts',
      'Roboto',
      'Merriweather',
    ]);
  });

  it('leaves out the heading of an empty group', () => {
    expect(shape(groupFontRows([font('Inter')], ['Inter'], labels))).toEqual([
      '# Recent',
      'Inter',
    ]);
  });
});
