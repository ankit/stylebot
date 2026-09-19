import { getTokenAtCaret, replaceToken } from '@stylebot/css';

import {
  GoogleFont,
  GoogleFontCategory,
  matchGoogleFonts,
  matchesFontQuery,
} from './fonts';

export type FontSuggestion =
  | { kind: 'default'; value: '' }
  | {
      kind: 'font';
      family: string;
      value: string;
      category?: GoogleFontCategory;
    }
  | { kind: 'custom'; value: string };

/**
 * Rows for the font picker. While the text is empty or still the applied
 * value: the default plus the recently used fonts. Once edited: completions
 * for the family being typed (the last comma-separated segment) from the
 * recents and then Google Fonts, followed by the raw text as-is so local
 * fonts and stacks can be entered directly.
 */
export const suggestFonts = (
  text: string,
  applied: string,
  recents: Array<string>,
  googleFonts: Array<GoogleFont>
): Array<FontSuggestion> => {
  const categories = new Map(
    googleFonts.map(font => [font.family, font.category])
  );
  const rows: Array<FontSuggestion> = [];
  const listed = new Set<string>();

  const add = (family: string, value: string) => {
    const id = family.toLowerCase();

    if (!listed.has(id)) {
      listed.add(id);
      rows.push({
        kind: 'font',
        family,
        value,
        category: categories.get(family),
      });
    }
  };

  if (!text.trim() || text === applied) {
    rows.push({ kind: 'default', value: '' });
    recents.forEach(font => add(font, font));
    return rows;
  }

  const token = getTokenAtCaret(text, text.length);
  const complete = (family: string) =>
    add(family, replaceToken(text, token, family));

  recents.filter(font => matchesFontQuery(font, token.value)).forEach(complete);
  matchGoogleFonts(token.value, googleFonts).forEach(font =>
    complete(font.family)
  );

  const raw = text.trim();
  if (!rows.some(row => row.value.toLowerCase() === raw.toLowerCase())) {
    rows.push({ kind: 'custom', value: raw });
  }

  return rows;
};
