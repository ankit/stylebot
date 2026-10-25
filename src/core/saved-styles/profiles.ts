import type {
  GalleryListing,
  StyleProfile,
  StyleProfiles,
  StyleWithoutUrl,
  Timestamp,
} from '@stylebot/types';
import { getCurrentTimestamp } from '@stylebot/utils';

export const DEFAULT_PROFILE_ID = 'default';

type WithProfiles = Pick<StyleWithoutUrl, 'css' | 'profiles' | 'activeProfile'>;

export type ProfileSheet = {
  name: string;
  css: string;
  galleryListing?: GalleryListing;
  createdAt?: Timestamp;
};

/**
 * Every profile of a style with its css in one place, whichever is active.
 * Sheets are in display order: the default profile, then in the order they
 * were added.
 */
export type ExpandedProfiles = {
  active: string;
  sheets: { [id: string]: ProfileSheet };
};

export type ProfileSummary = {
  id: string;
  name: string;
  active: boolean;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isProfile = (value: unknown): value is StyleProfile =>
  isPlainObject(value) &&
  typeof value.name === 'string' &&
  (value.css === undefined || typeof value.css === 'string');

const isGalleryListing = (value: unknown): value is GalleryListing =>
  isPlainObject(value) &&
  Number.isSafeInteger(value.styleId) &&
  typeof value.slug === 'string' &&
  typeof value.version === 'number' &&
  typeof value.cssHash === 'string' &&
  typeof value.published === 'boolean';

/**
 * A stored gallery listing with only the fields a listing has, or undefined
 * when it isn't one.
 */
const repairGalleryListing = (value: unknown): GalleryListing | undefined => {
  if (!isGalleryListing(value)) {
    return undefined;
  }

  const { styleId, slug, version, cssHash, published } = value;

  return { styleId, slug, version, cssHash, published };
};

/**
 * Whether two gallery listings are of the same style at the same version,
 * both installed or both published.
 */
export const isSameGalleryListing = (
  a: GalleryListing | undefined,
  b: GalleryListing | undefined
): boolean => {
  if (!a || !b) {
    return a === b;
  }

  return (
    a.styleId === b.styleId &&
    a.slug === b.slug &&
    a.version === b.version &&
    a.cssHash === b.cssHash &&
    a.published === b.published
  );
};

/**
 * The fields of a profile this version doesn't know, which a newer Stylebot
 * may have added.
 */
const getUnknownFields = (profile: StyleProfile): Record<string, unknown> => {
  const fields: Record<string, unknown> = { ...profile };

  delete fields.name;
  delete fields.css;
  delete fields.galleryListing;

  return fields;
};

/**
 * Whether two profiles have the same fields this version doesn't know.
 */
export const hasSameUnknownFields = (
  a: StyleProfile,
  b: StyleProfile
): boolean =>
  JSON.stringify(getUnknownFields(a)) === JSON.stringify(getUnknownFields(b));

/**
 * A profile entry as stored: css only when it isn't the active profile's, a
 * gallery listing only when it has one, and any field this version doesn't
 * know kept as it is, so it survives until a newer version reads it again.
 */
const getStoredProfile = (
  { css, galleryListing, ...fields }: StyleProfile,
  isActive: boolean
): StyleProfile => {
  const profile: StyleProfile = fields;

  if (!isActive && css !== undefined) {
    profile.css = css;
  }

  if (galleryListing) {
    profile.galleryListing = galleryListing;
  }

  return profile;
};

/**
 * Profiles as stored, keyed by id, with css on every one but the active one.
 */
const getStoredProfiles = (
  entries: Array<[string, StyleProfile]>,
  active: string
): StyleProfiles => {
  const stored = entries.map(([id, profile]) => [
    id,
    getStoredProfile(profile, id === active),
  ]);

  return Object.fromEntries(stored);
};

/**
 * Repairs a style's profiles into the stored shape: invalid entries and
 * gallery listings dropped, the active id one of the profiles, and its css
 * only in the style's own css. Fields it doesn't know are kept. A style left
 * without profiles loses both fields.
 */
export const normalizeProfiles = <T extends WithProfiles>(style: T): T => {
  const { profiles, activeProfile, ...rest } = style;

  if (profiles === undefined && activeProfile === undefined) {
    return style;
  }

  const entries = isPlainObject(profiles)
    ? Object.entries(profiles).filter(([, profile]) => isProfile(profile))
    : [];

  if (entries.length === 0) {
    return rest as T;
  }

  const ids = entries.map(([id]) => id);
  const active =
    activeProfile !== undefined && ids.includes(activeProfile)
      ? activeProfile
      : entries.find(([, profile]) => profile.css === undefined)?.[0] ?? ids[0];

  const repaired = entries.map(([id, profile]): [string, StyleProfile] => [
    id,
    {
      ...profile,
      galleryListing: repairGalleryListing(profile.galleryListing),
    },
  ]);
  const storedProfiles = getStoredProfiles(repaired, active);

  return { ...style, activeProfile: active, profiles: storedProfiles };
};

/**
 * When a profile was added, or 0 for one added before Stylebot recorded it.
 */
const getCreatedTime = (profile: StyleProfile): number => {
  const time = new Date(profile.createdAt ?? '').getTime();

  return Number.isNaN(time) ? 0 : time;
};

/**
 * Orders profile ids for display: the default profile first, then in the
 * order they were added, so a rename doesn't move one. Profiles from before
 * that was recorded come first, by name, and the id breaks any tie.
 */
const inDisplayOrder =
  (profiles: StyleProfiles) =>
  (a: string, b: string): number => {
    if (a === DEFAULT_PROFILE_ID) {
      return -1;
    }
    if (b === DEFAULT_PROFILE_ID) {
      return 1;
    }

    const timeA = getCreatedTime(profiles[a]);
    const timeB = getCreatedTime(profiles[b]);

    if (timeA || timeB) {
      return timeA - timeB || a.localeCompare(b);
    }

    return (
      profiles[a].name.localeCompare(profiles[b].name) || a.localeCompare(b)
    );
  };

/**
 * Every profile of a style with its css. A style that never had profiles
 * reads as one unnamed default profile.
 */
export const expandProfiles = (style: WithProfiles): ExpandedProfiles => {
  const { css, profiles, activeProfile } = normalizeProfiles(style);

  if (!profiles || activeProfile === undefined) {
    return {
      active: DEFAULT_PROFILE_ID,
      sheets: { [DEFAULT_PROFILE_ID]: { name: '', css } },
    };
  }

  const sheets: ExpandedProfiles['sheets'] = {};
  // chrome.storage sorts object keys, so stored order is not creation order.
  const ids = Object.keys(profiles).sort(inDisplayOrder(profiles));

  for (const id of ids) {
    const profile = profiles[id];
    sheets[id] = {
      ...profile,
      css: id === activeProfile ? css : profile.css ?? '',
    };
  }

  return { active: activeProfile, sheets };
};

/**
 * Writes expanded profiles back into the stored shape: the active sheet's css
 * into the style's css, every other sheet's into its profile.
 */
export const collapseProfiles = <T extends WithProfiles>(
  style: T,
  { active, sheets }: ExpandedProfiles
): T => {
  const profiles = getStoredProfiles(Object.entries(sheets), active);

  return { ...style, css: sheets[active].css, activeProfile: active, profiles };
};

/**
 * One of a style's profiles with its css, or undefined when the style or the
 * profile doesn't exist.
 */
export const getProfileSheet = (
  style: WithProfiles | undefined,
  profileId: string
): ProfileSheet | undefined =>
  style ? expandProfiles(style).sheets[profileId] : undefined;

/**
 * The style's profiles in display order, with which one is active.
 */
export const listProfiles = (style: WithProfiles): Array<ProfileSummary> => {
  const { active, sheets } = expandProfiles(style);

  return Object.entries(sheets).map(([id, { name }]) => ({
    id,
    name,
    active: id === active,
  }));
};

/**
 * Whether any of the style's profiles has css, active or not.
 */
export const hasAnyCss = (style: WithProfiles): boolean =>
  !!style.css ||
  Object.values(style.profiles ?? {}).some(profile => !!profile.css);

/**
 * Adds a profile, stamped with when it was added, turning a style without
 * profiles into one whose existing css is the default profile.
 */
export const addProfile = <T extends WithProfiles>(
  style: T,
  {
    id,
    name,
    css,
    galleryListing,
    activate,
  }: {
    id: string;
    name: string;
    css: string;
    galleryListing?: GalleryListing;
    activate: boolean;
  }
): T => {
  const expanded = expandProfiles(style);

  if (id in expanded.sheets) {
    return style;
  }

  return collapseProfiles(style, {
    active: activate ? id : expanded.active,
    sheets: {
      ...expanded.sheets,
      [id]: { name, css, galleryListing, createdAt: getCurrentTimestamp() },
    },
  });
};

/**
 * Makes a profile the active one, moving its css into the style's css.
 */
export const activateProfile = <T extends WithProfiles>(
  style: T,
  id: string
): T => {
  const expanded = expandProfiles(style);

  if (!(id in expanded.sheets) || expanded.active === id) {
    return style;
  }

  return collapseProfiles(style, { ...expanded, active: id });
};

/**
 * Changes one profile's name or css. Returns the style itself when the
 * profile does not exist or already has those values.
 */
const updateSheet = <T extends WithProfiles>(
  style: T,
  id: string,
  change: Partial<ProfileSheet>
): T => {
  const expanded = expandProfiles(style);
  const sheet = expanded.sheets[id];

  if (
    !sheet ||
    Object.entries(change).every(
      ([key, value]) => sheet[key as keyof ProfileSheet] === value
    )
  ) {
    return style;
  }

  return collapseProfiles(style, {
    ...expanded,
    sheets: { ...expanded.sheets, [id]: { ...sheet, ...change } },
  });
};

/**
 * Sets the gallery listing a profile was installed from or published as.
 */
export const setProfileGalleryListing = <T extends WithProfiles>(
  style: T,
  id: string,
  galleryListing: GalleryListing
): T => {
  const sheet = expandProfiles(style).sheets[id];

  return sheet && isSameGalleryListing(sheet.galleryListing, galleryListing)
    ? style
    : updateSheet(style, id, { galleryListing });
};

/**
 * Removes a profile's gallery listing, leaving the profile itself as it is.
 */
export const removeProfileGalleryListing = <T extends WithProfiles>(
  style: T,
  id: string
): T => updateSheet(style, id, { galleryListing: undefined });

/**
 * Removes the gallery listings that match from all of a style's profiles.
 * Returns the style itself when none match.
 */
export const removeGalleryListings = <T extends WithProfiles>(
  style: T,
  matches: (galleryListing: GalleryListing) => boolean
): T => {
  const { sheets } = expandProfiles(style);
  const ids = Object.keys(sheets).filter(id => {
    const { galleryListing } = sheets[id];
    return galleryListing !== undefined && matches(galleryListing);
  });

  return ids.reduce(removeProfileGalleryListing, style);
};

/**
 * Renames a profile.
 */
export const renameProfile = <T extends WithProfiles>(
  style: T,
  id: string,
  name: string
): T => updateSheet(style, id, { name });

/**
 * Removes a profile, never the last one. Removing the active profile makes
 * the one after it active, or the one before when it was last.
 */
export const removeProfile = <T extends WithProfiles>(
  style: T,
  id: string
): T => {
  const expanded = expandProfiles(style);
  const ids = Object.keys(expanded.sheets);
  const index = ids.indexOf(id);

  if (index === -1 || ids.length === 1) {
    return style;
  }

  const sheets = { ...expanded.sheets };
  delete sheets[id];

  const active =
    expanded.active === id ? ids[index + 1] ?? ids[index - 1] : expanded.active;

  return collapseProfiles(style, { active, sheets });
};

/**
 * Sets one profile's css, active or not. The active one's is the style's own
 * css, so a style without profiles doesn't gain them on a save.
 */
export const setProfileCss = <T extends WithProfiles>(
  style: T,
  id: string,
  css: string
): T =>
  id === expandProfiles(style).active
    ? { ...style, css }
    : updateSheet(style, id, { css });

/**
 * Whether a name is already in use, ignoring case and surrounding spaces.
 */
export const isProfileNameTaken = (
  name: string,
  names: Array<string>
): boolean => {
  const wanted = name.trim().toLowerCase();

  return names.some(other => other.toLowerCase() === wanted);
};

/**
 * The name, or the name with the first number that makes it unused.
 */
export const freeProfileName = (name: string, names: Array<string>): string => {
  let candidate = name;

  for (let n = 2; isProfileNameTaken(candidate, names); n++) {
    candidate = `${name} ${n}`;
  }

  return candidate;
};
