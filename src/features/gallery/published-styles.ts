// Remembers which gallery style each Stylebot profile was published as, so
// publishing it again makes a new version instead of a new style.
import type { GalleryPublished } from '@stylebot/types';

const PUBLISHED_STYLES_KEY = 'gallery-published';

/**
 * What was published from a profile, and by which account, since another
 * account signing in here can't update it.
 */
export type PublishedStyleRecord = GalleryPublished & { accountId: string };

// Keyed by Stylebot style url and profile id.
type PublishedStylesByProfile = Record<string, PublishedStyleRecord>;

const getKey = (url: string, profileId: string): string =>
  JSON.stringify([url, profileId]);

const getPublishedStylesByProfile =
  async (): Promise<PublishedStylesByProfile> =>
    (await chrome.storage.local.get(PUBLISHED_STYLES_KEY))[
      PUBLISHED_STYLES_KEY
    ] ?? {};

const setPublishedStylesByProfile = (
  map: PublishedStylesByProfile
): Promise<void> => chrome.storage.local.set({ [PUBLISHED_STYLES_KEY]: map });

/**
 * What this account published from a Stylebot style's profile, so publishing
 * again makes a new version of it.
 */
export const getPublishedStyleForProfile = async (
  url: string,
  profileId: string,
  accountId: string
): Promise<PublishedStyleRecord | null> => {
  const published = (await getPublishedStylesByProfile())[
    getKey(url, profileId)
  ];
  return published?.accountId === accountId ? published : null;
};

/**
 * The id of the gallery style a profile was published as, if any.
 */
export const getPublishedStyleIdForProfile = async (
  url: string,
  profileId: string,
  accountId: string
): Promise<string | null> =>
  (await getPublishedStyleForProfile(url, profileId, accountId))?.styleId ??
  null;

/**
 * The ids of every gallery style published from here, by any account.
 */
export const getPublishedStyleIds = async (): Promise<Set<string>> =>
  new Set(
    Object.values(await getPublishedStylesByProfile()).map(each => each.styleId)
  );

/**
 * Remembers what a profile was published as, replacing what it was before.
 */
export const rememberPublishedStyle = async (
  url: string,
  profileId: string,
  published: PublishedStyleRecord
): Promise<void> => {
  const map = await getPublishedStylesByProfile();
  await setPublishedStylesByProfile({
    ...map,
    [getKey(url, profileId)]: published,
  });
};

/**
 * Forgets an unpublished style wherever it was published from.
 */
export const forgetPublishedStyle = async (styleId: string): Promise<void> => {
  const map = await getPublishedStylesByProfile();

  await setPublishedStylesByProfile(
    Object.fromEntries(
      Object.entries(map).filter(([, each]) => each.styleId !== styleId)
    )
  );
};
