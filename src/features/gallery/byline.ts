import { t } from '@stylebot/i18n';
import type { GalleryStyle } from '@stylebot/types';

/**
 * Who made a gallery style, and how many have installed it when anyone has,
 * as in "by maya · 1,240 installs".
 */
export const getGalleryByline = ({
  author,
  installs,
}: Pick<GalleryStyle, 'author' | 'installs'>): string => {
  const by = t('by_author', [author.username]);

  if (!installs) {
    return by;
  }

  const count = t(installs === 1 ? 'installs_one' : 'installs_other', [
    installs.toLocaleString(),
  ]);

  return `${by} · ${count}`;
};
