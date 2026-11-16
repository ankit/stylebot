import type { GoogleFont, GoogleFontCategory } from './fonts';
import type { FontSuggestion } from './suggest';

export type FontHeading = { kind: 'heading'; label: string };

type FontRow = Extract<FontSuggestion, { kind: 'font' }>;

const MIX_SIZE = 10;

const lowercased = (fonts: Array<string>): Set<string> =>
  new Set(fonts.map(font => font.toLowerCase()));

const withHeading = <Row>(
  label: string,
  rows: Array<Row>
): Array<Row | FontHeading> =>
  rows.length ? [{ kind: 'heading', label }, ...rows] : [];

const toRow = ({ family, category }: GoogleFont): FontRow => ({
  kind: 'font',
  family,
  value: family,
  category,
});

/**
 * Rows for every Google Font in a category, most popular first, for the
 * picker to list when a category is picked.
 */
export const categoryFonts = (
  category: GoogleFontCategory,
  googleFonts: Array<GoogleFont>
): Array<FontRow> =>
  googleFonts.filter(font => font.category === category).map(toRow);

/**
 * Rows for every Google Font that isn't among the recents, most popular
 * first, led by the top sans and serif fonts alternating, so the start of
 * the list shows both.
 */
export const allFonts = (
  googleFonts: Array<GoogleFont>,
  recents: Array<string>
): Array<FontRow> => {
  const recent = lowercased(recents);
  const fonts = googleFonts.filter(
    font => !recent.has(font.family.toLowerCase())
  );
  const top = (category: GoogleFontCategory) =>
    fonts.filter(font => font.category === category).slice(0, MIX_SIZE / 2);
  const serif = top('serif');
  const mix = top('sans-serif')
    .flatMap((font, index) => [font, serif[index]])
    .filter((font): font is GoogleFont => !!font);
  const rest = fonts.filter(font => !mix.includes(font));

  return [...mix, ...rest].map(toRow);
};

/**
 * Lays the picker's rows out from top to bottom: the default, the recent
 * fonts and the Google Fonts under their headings, then the typed text. A
 * category search interleaves recent and Google fonts, so each keeps its
 * order within its group.
 */
export const groupFontRows = <Row extends FontSuggestion>(
  rows: Array<Row>,
  recents: Array<string>,
  labels: { recent: string; google: string }
): Array<Row | FontHeading> => {
  const recent = lowercased(recents);
  const isRecent = (row: FontSuggestion) =>
    row.kind === 'font' && recent.has(row.family.toLowerCase());
  const fonts = rows.filter(row => row.kind === 'font');

  return [
    ...rows.filter(row => row.kind === 'default'),
    ...withHeading(labels.recent, fonts.filter(isRecent)),
    ...withHeading(
      labels.google,
      fonts.filter(row => !isRecent(row))
    ),
    ...rows.filter(row => row.kind === 'custom'),
  ];
};
