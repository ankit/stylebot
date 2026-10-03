import type { StyleMap } from '@stylebot/types';

import { normalizeProfiles } from './profiles';

const isStyle = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return typeof (value as { css?: unknown }).css === 'string';
};

/**
 * Whether a value read back from outside the extension, a synced file or an
 * imported backup, is a map of style objects that may reach a merge or a
 * restore.
 */
export const isStyleMap = (value: unknown): value is StyleMap => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(isStyle);
};

/**
 * A copy of the map with every style's profiles repaired, for a map that
 * came from outside the extension.
 */
export const sanitizeStyleMap = (styles: StyleMap): StyleMap => {
  const sanitized: StyleMap = {};

  for (const [url, style] of Object.entries(styles)) {
    sanitized[url] = normalizeProfiles(style);
  }

  return sanitized;
};
