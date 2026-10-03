import type { StyleProfiles } from '@stylebot/types';

export const DEFAULT_PROFILE_ID = 'default';

type WithProfiles = {
  css: string;
  profiles?: StyleProfiles;
  activeProfile?: string;
};

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

/**
 * Repairs a style's profiles so they hold to the stored shape: both fields
 * present or both absent, the active id one of the profiles, and its css only
 * in the style's own css. Returns the style itself when nothing needs fixing.
 */
export const normalizeProfiles = <T extends WithProfiles>(style: T): T => {
  const { profiles, activeProfile } = style;

  if (profiles === undefined && activeProfile === undefined) {
    return style;
  }

  const valid: StyleProfiles = {};

  if (isPlainObject(profiles)) {
    for (const [id, profile] of Object.entries(profiles)) {
      if (
        isPlainObject(profile) &&
        typeof profile.name === 'string' &&
        (profile.css === undefined || typeof profile.css === 'string')
      ) {
        valid[id] =
          profile.css === undefined
            ? { name: profile.name }
            : { name: profile.name, css: profile.css };
      }
    }
  }

  const ids = Object.keys(valid);

  if (ids.length === 0) {
    const { profiles: _profiles, activeProfile: _active, ...rest } = style;
    return rest as T;
  }

  const active =
    activeProfile !== undefined && activeProfile in valid
      ? activeProfile
      : ids.find(id => valid[id].css === undefined) ?? ids[0];

  valid[active] = { name: valid[active].name };

  const unchanged =
    active === activeProfile &&
    ids.length === Object.keys(profiles as object).length &&
    ids.every(
      id =>
        (profiles as StyleProfiles)[id].name === valid[id].name &&
        (profiles as StyleProfiles)[id].css === valid[id].css
    );

  return unchanged
    ? style
    : { ...style, profiles: valid, activeProfile: active };
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
  const ids = Object.keys(profiles).sort((a, b) =>
    a === DEFAULT_PROFILE_ID || b === DEFAULT_PROFILE_ID
      ? Number(b === DEFAULT_PROFILE_ID) - Number(a === DEFAULT_PROFILE_ID)
      : profiles[a].name.localeCompare(profiles[b].name) || (a < b ? -1 : 1)
  );

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
  const profiles: StyleProfiles = {};

  for (const [id, sheet] of Object.entries(sheets)) {
    profiles[id] =
      id === active
        ? { name: sheet.name }
        : { name: sheet.name, css: sheet.css };
  }

  return {
    ...style,
    css: sheets[active].css,
    profiles,
    activeProfile: active,
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
 * Renames a profile.
 */
export const renameProfile = <T extends WithProfiles>(
  style: T,
  id: string,
  name: string
): T => {
  const expanded = expandProfiles(style);

  if (!(id in expanded.sheets) || expanded.sheets[id].name === name) {
    return style;
  }

  return collapseProfiles(style, {
    ...expanded,
    sheets: { ...expanded.sheets, [id]: { ...expanded.sheets[id], name } },
  });
};

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
 * Sets one profile's css, active or not. Returns the style itself when the
 * profile does not exist.
 */
export const setProfileCss = <T extends WithProfiles>(
  style: T,
  id: string,
  css: string
): T => {
  const expanded = expandProfiles(style);

  if (!(id in expanded.sheets)) {
    return style;
  }

  if (id === expanded.active) {
    return { ...style, css };
  }

  return collapseProfiles(style, {
    ...expanded,
    sheets: { ...expanded.sheets, [id]: { ...expanded.sheets[id], css } },
  });
};
