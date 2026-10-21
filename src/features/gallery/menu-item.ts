import type { GetPublishedGalleryStyleResponse } from '@stylebot/types';

import { hashCss } from './utils';

export type GalleryMenuItem = {
  label:
    | 'view_in_gallery'
    | 'publish_to_gallery'
    | 'publish_update'
    | 'manage_publishing';
  // The published style has changes to publish.
  changed: boolean;
};

/**
 * What a profile's menu offers for the Gallery: a style installed from
 * someone else links to its page there, and one of yours is published,
 * updated or managed.
 */
export const getGalleryMenuItem = (
  { published, installed }: GetPublishedGalleryStyleResponse,
  css: string
): GalleryMenuItem => {
  if (!published && installed) {
    return { label: 'view_in_gallery', changed: false };
  }

  if (!published) {
    return { label: 'publish_to_gallery', changed: false };
  }

  if (hashCss(css) !== published.cssHash) {
    return { label: 'publish_update', changed: true };
  }

  return { label: 'manage_publishing', changed: false };
};
