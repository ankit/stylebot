export type GoogleFontCategory =
  | 'sans-serif'
  | 'serif'
  | 'display'
  | 'handwriting'
  | 'monospace';

export type GoogleFont = {
  family: string;
  category: GoogleFontCategory;
};

let pending: Promise<Array<GoogleFont>> | null = null;

/**
 * Loads the bundled Google Fonts list (most popular first). The result is
 * memoized; a failed load resolves to an empty list and is retried next time.
 */
export const loadGoogleFonts = (): Promise<Array<GoogleFont>> => {
  if (pending) {
    return pending;
  }

  pending = fetch(chrome.runtime.getURL('google-fonts/fonts.json'))
    .then(response => response.json())
    .then((entries: Array<[string, GoogleFontCategory]>) =>
      entries.map(([family, category]) => ({ family, category }))
    )
    .catch(() => {
      pending = null;
      return [];
    });

  return pending;
};

/**
 * Whether a family name starts with the query at the beginning of any word,
 * ignoring case: "play" and "dis" both match "Playfair Display".
 */
export const matchesFontQuery = (family: string, query: string): boolean => {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return false;
  }

  const haystack = family.toLowerCase();
  return haystack.startsWith(needle) || haystack.includes(` ${needle}`);
};

const CATEGORY_QUERIES: Record<string, GoogleFontCategory> = {
  sans: 'sans-serif',
  'sans-serif': 'sans-serif',
  serif: 'serif',
  display: 'display',
  handwriting: 'handwriting',
  mono: 'monospace',
  monospace: 'monospace',
};

/**
 * Returns up to `limit` fonts for the query, in the list's own order: a
 * category name ("serif", "mono") lists that category, anything else matches
 * family names.
 */
export const matchGoogleFonts = (
  query: string,
  fonts: Array<GoogleFont>,
  limit = 8
): Array<GoogleFont> => {
  const category = CATEGORY_QUERIES[query.trim().toLowerCase()];
  const matches = category
    ? (font: GoogleFont) => font.category === category
    : (font: GoogleFont) => matchesFontQuery(font.family, query);

  return fonts.filter(matches).slice(0, limit);
};
