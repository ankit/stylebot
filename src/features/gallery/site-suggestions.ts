import type { GalleryStyle } from '@stylebot/types';

import { getSiteStyles } from './api';

const SITE_SUGGESTIONS_KEY = 'gallery-site-suggestions';
const FRESH_FOR = 60 * 60 * 1000;
const KEPT_FOR = 7 * 24 * 60 * 60 * 1000;
const KEPT_SITES = 50;

export type SiteSuggestions = { styles: Array<GalleryStyle>; total: number };
type StoredSuggestions = {
  styles: Array<GalleryStyle>;
  total?: number;
  fetchedAt: number;
};
type StoredSites = Record<string, StoredSuggestions>;

const refreshing = new Map<string, Promise<SiteSuggestions>>();
let writing: Promise<void> = Promise.resolve();

const read = async (): Promise<StoredSites> =>
  (await chrome.storage.local.get(SITE_SUGGESTIONS_KEY))[
    SITE_SUGGESTIONS_KEY
  ] ?? {};

/**
 * Stores a site's styles, keeping only the sites fetched most recently.
 * Writes go one at a time, so two sites refreshed together both land.
 */
const store = (site: string, entry: StoredSuggestions): Promise<void> => {
  writing = writing.then(async () => {
    const sites = { ...(await read()), [site]: entry };
    const kept = Object.entries(sites)
      .sort(([, a], [, b]) => b.fetchedAt - a.fetchedAt)
      .slice(0, KEPT_SITES);

    await chrome.storage.local.set({
      [SITE_SUGGESTIONS_KEY]: Object.fromEntries(kept),
    });
  });

  return writing;
};

const refresh = (
  site: string,
  limit: number,
  now: number
): Promise<SiteSuggestions> => {
  const pending = refreshing.get(site);

  if (pending) {
    return pending;
  }

  const request = getSiteStyles(site, limit)
    .then(async ({ styles, total = styles.length }) => {
      await store(site, { styles, total, fetchedAt: now });
      return { styles, total };
    })
    .finally(() => {
      refreshing.delete(site);
    });

  refreshing.set(site, request);
  return request;
};

/**
 * A site's most installed gallery styles and how many it has in all,
 * answered from the last fetch so
 * the popup opens with them in place. One older than an hour is still
 * answered with, and fetched again for the next time.
 */
export const getSiteSuggestions = async (
  site: string,
  limit: number,
  now = Date.now()
): Promise<SiteSuggestions> => {
  const stored = (await read())[site];
  const age = stored ? now - stored.fetchedAt : Infinity;

  if (!stored || age >= KEPT_FOR) {
    return refresh(site, limit, now);
  }

  if (age >= FRESH_FOR) {
    refresh(site, limit, now).catch(() => {});
  }

  return {
    styles: stored.styles,
    total: stored.total ?? stored.styles.length,
  };
};
