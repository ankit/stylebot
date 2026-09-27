// What applyReadability() has learned on this origin, so an auto re-apply
// can decide whether to attempt and whether to show the loader.
const STORAGE_KEY = 'stylebot-reader-eligibility';

type EligibilityStore = {
  // origin+pathname -> false once every retry is exhausted with no article found.
  urls: Record<string, false>;
  // wildcard pattern (see patternKey()) -> true once some url with that
  // shape has produced a reader view.
  patterns: Record<string, true>;
};

const emptyStore = (): EligibilityStore => ({ urls: {}, patterns: {} });

const readStore = (): EligibilityStore => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyStore();
    }

    const parsed = JSON.parse(raw);
    return {
      urls: parsed.urls ?? {},
      patterns: parsed.patterns ?? {},
    };
  } catch {
    // localStorage may be unavailable, or hold something unexpected.
    return emptyStore();
  }
};

const writeStore = (store: EligibilityStore): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage may be unavailable; nothing learned this visit.
  }
};

// Origin-prefixed even though localStorage is already origin-scoped in a
// real browser — keeps the store correct if that assumption ever breaks.
const urlKey = (url: string): string | null => {
  try {
    const { origin, pathname } = new URL(url);
    return `${origin}${pathname}`;
  } catch {
    return null;
  }
};

const isWildcardSegment = (segment: string): boolean => /^\d+$/.test(segment);

// Drops the last segment (the article's own slug/id) and wildcards any
// numeric segment left, so e.g. nytimes.com/2026/09/14/health/some-headline
// and .../2027/01/02/health/other-headline share pattern "#/#/#/health".
const patternKey = (url: string): string | null => {
  try {
    const { origin, pathname } = new URL(url);
    const segments = pathname.split('/').filter(Boolean);
    const shape = segments
      .slice(0, -1)
      .map(segment => (isWildcardSegment(segment) ? '#' : segment))
      .join('/');

    return `${origin}/${shape}`;
  } catch {
    return null;
  }
};

export type Eligibility = {
  isKnownIneligible: boolean;
  matchesKnownPattern: boolean;
};

/**
 * Everything applyReadability() needs to know about this url from prior
 * apply attempts on this origin.
 */
export const getEligibility = (url: string): Eligibility => {
  const store = readStore();
  const path = urlKey(url);
  const pattern = patternKey(url);

  return {
    isKnownIneligible: path !== null && store.urls[path] === false,
    matchesKnownPattern: pattern !== null && !!store.patterns[pattern],
  };
};

/**
 * Records that this url produced a reader view, and remembers its shape.
 */
export const markEligible = (url: string): void => {
  const store = readStore();
  const path = urlKey(url);
  const pattern = patternKey(url);

  if (path !== null) {
    delete store.urls[path];
  }
  if (pattern !== null) {
    store.patterns[pattern] = true;
  }

  writeStore(store);
};

/**
 * Records that this exact url couldn't produce a reader view.
 */
export const markIneligible = (url: string): void => {
  const store = readStore();
  const path = urlKey(url);

  if (path === null) {
    return;
  }

  store.urls[path] = false;
  writeStore(store);
};
