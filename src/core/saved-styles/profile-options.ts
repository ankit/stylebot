import type { StyleOptionValues, StyleWithoutUrl } from '@stylebot/types';

import { expandProfiles } from './profiles';

type WithProfileOptions = Pick<StyleWithoutUrl, 'profileOptions'>;
type WithProfilesAndOptions = Pick<
  StyleWithoutUrl,
  'css' | 'profiles' | 'activeProfile' | 'profileOptions'
>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const withoutProfileOptions = <T extends WithProfileOptions>(style: T): T => {
  const copy = { ...style };

  delete copy.profileOptions;
  return copy;
};

/**
 * The option values picked for one of a style's profiles, with anything
 * that isn't a string value left out.
 */
export const getProfileOptions = (
  style: WithProfileOptions | undefined,
  profileId: string
): StyleOptionValues => {
  const all: unknown = style?.profileOptions;
  const values = isPlainObject(all) ? all[profileId] : undefined;

  if (!isPlainObject(values)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => typeof value === 'string')
  ) as StyleOptionValues;
};

/**
 * Sets one option's value for a profile. Returns the style itself when the
 * value is already set.
 */
export const setProfileOption = <T extends WithProfileOptions>(
  style: T,
  profileId: string,
  name: string,
  value: string
): T => {
  const values = getProfileOptions(style, profileId);

  if (values[name] === value) {
    return style;
  }

  return {
    ...style,
    profileOptions: {
      ...style.profileOptions,
      [profileId]: { ...values, [name]: value },
    },
  };
};

/**
 * Drops the option values of profiles the style no longer has, and the
 * field once none are left. Returns the style itself when none are stale.
 */
export const pruneProfileOptions = <T extends WithProfilesAndOptions>(
  style: T
): T => {
  const all = style.profileOptions;

  if (!isPlainObject(all)) {
    return style;
  }

  const { sheets } = expandProfiles(style);
  const kept = Object.entries(all).filter(([id]) => id in sheets);

  if (kept.length === Object.keys(all).length) {
    return style;
  }

  return kept.length > 0
    ? { ...style, profileOptions: Object.fromEntries(kept) }
    : withoutProfileOptions(style);
};

/**
 * A merged style with this device's option values in place of the synced
 * copy's, since they're the device's own choice.
 */
export const keepLocalProfileOptions = <T extends WithProfileOptions>(
  merged: T,
  local: WithProfileOptions | undefined
): T =>
  local?.profileOptions === undefined
    ? withoutProfileOptions(merged)
    : { ...merged, profileOptions: local.profileOptions };
