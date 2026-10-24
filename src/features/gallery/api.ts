import type { GalleryStyle } from '@stylebot/types';

import { request } from './request';

/**
 * A page of styles; nextOffset is null on the last one.
 */
export type GalleryStylesPage = {
  styles: Array<GalleryStyle>;
  nextOffset: number | null;
  // Every style matching, across pages; missing from an older API.
  total?: number;
};

export type GalleryStyleWithCss = GalleryStyle & { css: string };

/**
 * A gallery style with the CSS of its latest version, trimmed to what saving
 * it as a profile needs.
 */
export type GalleryStyleToInstall = Pick<
  GalleryStyleWithCss,
  'id' | 'site' | 'name' | 'version' | 'css'
>;

/**
 * A site's live styles, most installed first.
 */
export const getSiteStyles = (
  site: string,
  limit: number
): Promise<GalleryStylesPage> =>
  request(`/styles?${new URLSearchParams({ site, limit: String(limit) })}`);

/**
 * Every hostname that has a live style.
 */
export const getGallerySites = async (): Promise<Array<string>> => {
  const { hosts } = await request<{ hosts: Array<string> }>('/sites/hosts');
  return hosts;
};

/**
 * A live style with the CSS of its latest version.
 */
export const getStyle = (id: number): Promise<GalleryStyleWithCss> =>
  request(`/styles/${id}`);

/**
 * Counts an install of a style, once per install id however often it's
 * sent, and answers with its latest CSS.
 */
export const recordInstall = (
  id: number,
  installId: string
): Promise<GalleryStyleToInstall> =>
  request(`/styles/${id}/installs`, {
    method: 'POST',
    json: { installId },
  });
