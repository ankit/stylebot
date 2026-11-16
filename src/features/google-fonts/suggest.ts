import { getTokenAtCaret, replaceToken } from '@stylebot/css';

import type { GoogleFont, GoogleFontCategory } from './fonts';
import { getFontCategory, matchGoogleFonts, matchesFontQuery } from './fonts';
import { isGenericFamily } from './installed';

export type FontSuggestion =
  | { kind: 'default'; value: '' }
  | {
      kind: 'font';
      family: string;
      value: string;
      category?: GoogleFontCategory;
    }
  | { kind: 'custom'; value: string };

// Reserved in CSS, so never a family name: `font-family: default` is dropped.
const DEFAULT_KEYWORD = 'default';

const defaultNames = (defaultLabel: string): Array<string> => [
  DEFAULT_KEYWORD,
  defaultLabel.toLowerCase(),
];

/**
 * Whether the text names the Default choice itself, in English or as the
 * (localized) label the picker shows for it, rather than a font.
 */
export const isDefaultFont = (text: string, defaultLabel: string): boolean =>
  defaultNames(defaultLabel).includes(text.trim().toLowerCase());

/**
 * Rows for the font picker: the default and recents until the text is edited;
 * then the default if the text starts its name, completions of the last
 * family typed (recents, then Google Fonts), and the text itself unless it
 * only names a category like "mono".
 */
export const suggestFonts = (
  text: string,
  applied: string,
  recents: Array<string>,
  googleFonts: Array<GoogleFont>,
  defaultLabel = 'Default'
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

  const raw = text.trim();
  const query = raw.toLowerCase();
  const namesDefault =
    !raw.includes(',') &&
    defaultNames(defaultLabel).some(name => name.startsWith(query));

  if (namesDefault) {
    rows.push({ kind: 'default', value: '' });
  }

  const token = getTokenAtCaret(text, text.length);
  const complete = (family: string) =>
    add(family, replaceToken(text, token, family));

  recents.filter(font => matchesFontQuery(font, token.value)).forEach(complete);
  // A category is browsed in full; a name only needs its closest matches.
  const limit = getFontCategory(token.value) ? Infinity : undefined;

  matchGoogleFonts(token.value, googleFonts, limit).forEach(font =>
    complete(font.family)
  );

  const namesCategoryOnly = !!getFontCategory(raw) && !isGenericFamily(raw);

  if (
    query !== DEFAULT_KEYWORD &&
    !namesCategoryOnly &&
    !rows.some(row => row.value.toLowerCase() === query)
  ) {
    rows.push({ kind: 'custom', value: raw });
  }

  return rows;
};
