import { expandProfiles } from '@stylebot/saved-styles';
import type {
  GalleryListing,
  GalleryPublishStatus,
  StyleMap,
  StyleWithoutUrl,
} from '@stylebot/types';

import { hashCss } from './utils';

/**
 * A profile with a gallery listing, with where it is and its css.
 */
export type ListedProfile = {
  url: string;
  profileId: string;
  name: string;
  css: string;
  galleryListing: GalleryListing;
};

/**
 * A style's profiles installed from or published to the gallery.
 */
const listStyleProfilesWithListings = (
  url: string,
  style: StyleWithoutUrl
): Array<ListedProfile> => {
  const sheets = Object.entries(expandProfiles(style).sheets);
  const listed: Array<ListedProfile> = [];

  for (const [profileId, { name, css, galleryListing }] of sheets) {
    if (galleryListing) {
      listed.push({ url, profileId, name, css, galleryListing });
    }
  }

  return listed;
};

/**
 * Every profile installed from or published to the gallery.
 */
const listProfilesWithListings = (styles: StyleMap): Array<ListedProfile> =>
  Object.entries(styles).flatMap(([url, style]) =>
    listStyleProfilesWithListings(url, style)
  );

/**
 * The profiles a gallery style was installed or published as, latest
 * version first.
 */
export const getListedProfiles = (
  styles: StyleMap,
  styleId: number
): Array<ListedProfile> =>
  listProfilesWithListings(styles)
    .filter(({ galleryListing }) => galleryListing.styleId === styleId)
    .sort((a, b) => b.galleryListing.version - a.galleryListing.version);

/**
 * The gallery styles installed or published here.
 */
export const getListedStyleIds = (styles: StyleMap): Set<number> =>
  new Set(
    listProfilesWithListings(styles).map(
      ({ galleryListing }) => galleryListing.styleId
    )
  );

/**
 * The profile name each of the given gallery styles is installed or
 * published as, leaving out the ones that aren't.
 */
export const getListedProfileNames = (
  styles: StyleMap,
  styleIds: Array<number>
): Record<string, string> => {
  const listed = listProfilesWithListings(styles).filter(({ galleryListing }) =>
    styleIds.includes(galleryListing.styleId)
  );

  return Object.fromEntries(
    listed.map(({ galleryListing, name }) => [galleryListing.styleId, name])
  );
};

/**
 * The one profile a gallery style was published from, or null when none or
 * several were, so there's no telling which to publish.
 */
export const getPublishedProfile = (
  styles: StyleMap,
  styleId: number
): ListedProfile | null => {
  const published = getListedProfiles(styles, styleId).filter(
    ({ galleryListing }) => galleryListing.published
  );

  return published.length === 1 ? published[0] : null;
};

/**
 * The version each of the given gallery styles was published at from here,
 * and whether its profile was edited since, leaving out the ones that weren't.
 */
export const getPublishedStatus = (
  styles: StyleMap,
  styleIds: Array<number>
): Record<string, GalleryPublishStatus> => {
  const status: Record<string, GalleryPublishStatus> = {};

  for (const styleId of styleIds) {
    const profile = getPublishedProfile(styles, styleId);

    if (profile) {
      const { version, cssHash } = profile.galleryListing;
      const changed = hashCss(profile.css) !== cssHash;

      status[styleId] = { version, changed };
    }
  }

  return status;
};

/**
 * A profile's gallery listing, if it has one.
 */
export const getProfileGalleryListing = (
  styles: StyleMap,
  url: string,
  profileId: string
): GalleryListing | null => {
  const style = styles[url];

  return (
    (style && expandProfiles(style).sheets[profileId]?.galleryListing) ?? null
  );
};
