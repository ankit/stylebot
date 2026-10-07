import {
  expandProfiles,
  isProfileNameTaken,
  listProfiles,
} from '@stylebot/saved-styles';
import type { StyleWithoutUrl } from '@stylebot/types';

import {
  applyStylesToAllTabs,
  createProfile,
  deleteProfile,
  getAll,
  renameProfile,
  setActiveProfile,
} from '../styles';
import { requireNamed, resolveStyleUrl } from './targets';
import type { CliCommands } from './types';

export const EMPTY_STYLE: StyleWithoutUrl = {
  css: '',
  readability: false,
  enabled: true,
  modifiedTime: '',
};

// The editor shows an unnamed profile, the one every style starts with, as Default.
const DEFAULT_PROFILE_NAME = 'Default';

export const activeCss = (style: StyleWithoutUrl): string => {
  const { active, sheets } = expandProfiles(style);
  return sheets[active]?.css ?? '';
};

const profilesOf = (style: StyleWithoutUrl | undefined) =>
  listProfiles(style ?? EMPTY_STYLE).map(profile => ({
    ...profile,
    name: profile.name || DEFAULT_PROFILE_NAME,
  }));

/**
 * The id of a style's profile named by its name, case-insensitively, or id.
 */
export const resolveProfileId = (
  style: StyleWithoutUrl | undefined,
  profile: unknown
): string => {
  const wanted = String(profile).trim().toLowerCase();
  const match = profilesOf(style).find(
    ({ id, name }) => id === profile || name.toLowerCase() === wanted
  );

  if (!match) {
    throw new Error(`No profile named ${profile}`);
  }

  return match.id;
};

export const profileCommands: CliCommands = {
  async profiles({ target }) {
    const url = await resolveStyleUrl(target);
    return { url, profiles: profilesOf((await getAll())[url]) };
  },

  async createProfile({ target, name, from, activate }) {
    requireNamed(target, 'site or tab');
    const url = await resolveStyleUrl(target);
    const style = (await getAll())[url];
    const profileName = String(name).trim();

    if (
      isProfileNameTaken(
        profileName,
        profilesOf(style).map(profile => profile.name)
      )
    ) {
      throw new Error(`A profile named ${profileName} already exists`);
    }

    const id = await createProfile(url, {
      name: profileName,
      sourceProfileId: from ? resolveProfileId(style, from) : undefined,
      activate: !!activate,
    });
    await applyStylesToAllTabs();

    return { url, id, name: profileName };
  },

  async useProfile({ target, profile }) {
    requireNamed(target, 'site or tab');
    const url = await resolveStyleUrl(target);
    const id = resolveProfileId((await getAll())[url], profile);

    await setActiveProfile(url, id);
    await applyStylesToAllTabs();

    return { url, id };
  },

  async renameProfile({ target, profile, name }) {
    requireNamed(target, 'site or tab');
    const url = await resolveStyleUrl(target);
    const style = (await getAll())[url];
    const id = resolveProfileId(style, profile);
    const profileName = String(name).trim();

    if (
      isProfileNameTaken(
        profileName,
        profilesOf(style)
          .filter(other => other.id !== id)
          .map(other => other.name)
      )
    ) {
      throw new Error(`A profile named ${profileName} already exists`);
    }

    await renameProfile(url, id, profileName);
    return { url, id, name: profileName };
  },

  async deleteProfile({ target, profile }) {
    requireNamed(target, 'site or tab');
    const url = await resolveStyleUrl(target);
    const style = (await getAll())[url];
    const id = resolveProfileId(style, profile);

    if (profilesOf(style).length === 1) {
      throw new Error("Can't delete a style's only profile");
    }

    await deleteProfile(url, id);
    await applyStylesToAllTabs();

    return { url, id };
  },
};
