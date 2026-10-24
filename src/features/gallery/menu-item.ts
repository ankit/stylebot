import type { GetPublishedGalleryStyleResponse } from '@stylebot/types';

import { getGalleryEditUrl, getGalleryStyleUrl } from './config';
import { hashCss } from './utils';

export type GalleryMenuItem = {
  label:
    | 'view_in_gallery'
    | 'publish_to_gallery'
    | 'publish_update'
    | 'manage_in_gallery';
  // The published style has changes to publish.
  changed: boolean;
  // The gallery page the item opens, rather than publishing.
  url?: string;
};

/**
 * What a profile's menu offers for the Gallery: a style installed from
 * someone else links to its page there, and one of yours is published,
 * updated, or edited on the gallery site.
 */
export const getGalleryMenuItem = (
  { published, installed }: GetPublishedGalleryStyleResponse,
  css: string
): GalleryMenuItem => {
  if (!published && installed) {
    return {
      label: 'view_in_gallery',
      changed: false,
      url: getGalleryStyleUrl(installed),
    };
  }

  if (!published) {
    return { label: 'publish_to_gallery', changed: false };
  }

  if (hashCss(css) !== published.cssHash) {
    return { label: 'publish_update', changed: true };
  }

  return {
    label: 'manage_in_gallery',
    changed: false,
    url: getGalleryEditUrl(published.styleId),
  };
};
