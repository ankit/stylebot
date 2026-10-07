import { expandProfiles } from '@stylebot/saved-styles';

import { applyStylesToAllTabs, getAll, set } from '../styles';
import { EMPTY_STYLE, activeCss, resolveProfileId } from './profiles';
import { requireNamed, resolveStyleUrl } from './targets';
import type { CliCommands } from './types';

export const styleCommands: CliCommands = {
  async styles() {
    const styles = await getAll();

    return Object.entries(styles).map(([url, style]) => ({
      url,
      enabled: style.enabled,
      css: activeCss(style),
    }));
  },

  async getCss({ target, profile }) {
    const url = await resolveStyleUrl(target);
    const style = (await getAll())[url];

    if (!profile) {
      return { url, css: style ? activeCss(style) : '' };
    }

    const id = resolveProfileId(style, profile);
    return { url, css: expandProfiles(style ?? EMPTY_STYLE).sheets[id].css };
  },

  async setCss({ target, css, profile }) {
    requireNamed(target, 'site or tab');
    const url = await resolveStyleUrl(target);
    const style = (await getAll())[url];
    const profileId = profile ? resolveProfileId(style, profile) : undefined;
    // Blank css, such as a lone newline from a pipe, deletes the style.
    const saved = String(css).trim() ? String(css) : '';

    await set(url, saved, style?.readability ?? false, undefined, profileId);
    await applyStylesToAllTabs();

    return { url, deleted: !saved };
  },
};
