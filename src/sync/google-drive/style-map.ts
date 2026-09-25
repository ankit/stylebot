import { StyleMap } from '@stylebot/types';

const isStyle = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return typeof (value as { css?: unknown }).css === 'string';
};

/**
 * The file is the user's, so it can hold anything by the time it is read
 * back: a hand edit in Drive, or an empty body. Only a map of style objects
 * may reach the merge, or a restore.
 */
export const isStyleMap = (value: unknown): value is StyleMap => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(isStyle);
};
