import { getGallerySites } from './api';

const SUGGESTION_SITES_KEY = 'gallery-suggestion-sites';
const MAX_AGE = 24 * 60 * 60 * 1000;

type StoredSites = { sites: Array<string>; fetchedAt: number };

let refreshing: Promise<Array<string>> | null = null;

const refresh = async (now: number): Promise<Array<string>> => {
  const sites = await getGallerySites();
  const stored: StoredSites = { sites, fetchedAt: now };
  await chrome.storage.local.set({ [SUGGESTION_SITES_KEY]: stored });

  return sites;
};

/**
 * The sites the gallery has styles for, fetched at most once a day, so the
 * popup only asks about a site the gallery already lists. The last list
 * stands in when the gallery can't be reached.
 */
export const getSuggestionSites = async (
  now = Date.now()
): Promise<Set<string>> => {
  const stored: StoredSites | undefined = (
    await chrome.storage.local.get(SUGGESTION_SITES_KEY)
  )[SUGGESTION_SITES_KEY];

  if (stored && now - stored.fetchedAt < MAX_AGE) {
    return new Set(stored.sites);
  }

  if (!refreshing) {
    refreshing = refresh(now).finally(() => {
      refreshing = null;
    });
  }

  try {
    const sites = await refreshing;
    return new Set(sites);
  } catch (e) {
    if (stored) {
      return new Set(stored.sites);
    }

    throw e;
  }
};
