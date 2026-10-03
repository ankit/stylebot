import type {
  StyleProfile,
  StyleProfiles,
  StyleWithoutUrl,
} from '@stylebot/types';

export const DEFAULT_PROFILE_ID = 'default';

type WithProfiles = Pick<StyleWithoutUrl, 'css' | 'profiles' | 'activeProfile'>;

export type ProfileSheet = {
  name: string;
  css: string;
};

/**
 * Every profile of a style with its css in one place, whichever is active.
 * Sheets are in display order: the default profile, then by name.
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

/**
 * Repairs a style's profiles into the stored shape: invalid entries dropped,
 * the active id one of the profiles, and its css only in the style's own
 * css. A style left without profiles loses both fields.
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

  return {
    ...style,
    activeProfile: active,
    profiles: Object.fromEntries(
      entries.map(([id, { name, css }]) =>
        id === active || css === undefined
          ? [id, { name }]
          : [id, { name, css }]
      )
    ),
  };
};

/**
 * Orders profile ids for display: the default profile first, then by name,
 * with the id breaking a tie between two profiles of the same name.
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
      name: profile.name,
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
  return {
    ...style,
    css: sheets[active].css,
    activeProfile: active,
    profiles: Object.fromEntries(
      Object.entries(sheets).map(([id, { name, css }]) => [
        id,
        id === active ? { name } : { name, css },
      ])
    ),
  };
};

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
 * Adds a profile, turning a style without profiles into one whose existing
 * css is the default profile.
 */
export const addProfile = <T extends WithProfiles>(
  style: T,
  {
    id,
    name,
    css,
    activate,
  }: { id: string; name: string; css: string; activate: boolean }
): T => {
  const expanded = expandProfiles(style);

  if (id in expanded.sheets) {
    return style;
  }

  return collapseProfiles(style, {
    active: activate ? id : expanded.active,
    sheets: { ...expanded.sheets, [id]: { name, css } },
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
