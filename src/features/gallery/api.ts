import type {
  GalleryAccount,
  GalleryPublishedStyle,
  GalleryStyle,
  GalleryUsernameCheck,
} from '@stylebot/types';

import { request } from './request';
import {
  toDetailsFormData,
  toFormData,
  type StyleDetailsForm,
  type StyleForm,
} from './to-form-data';

/**
 * A signed-in session: the token sent as a bearer on requests that need an
 * account, when it expires, and whose account it is.
 */
export type GallerySession = {
  session: string;
  expiresAt: number;
  account: GalleryAccount;
};

/**
 * Trades a Google access token that identifies the user for a gallery
 * session.
 */
export const createSession = (googleToken: string): Promise<GallerySession> =>
  request('/session', { method: 'POST', json: { googleToken } });

/**
 * Sets the username shown as the author of the account's styles, or
 * confirms the one the gallery made up when it's sent unchanged.
 */
export const setUsername = (
  session: string,
  username: string
): Promise<GalleryAccount> =>
  request('/me', { method: 'PATCH', session, json: { username } });

/**
 * Whether the account can take a username; its own current and old ones
 * are available.
 */
export const checkUsername = (
  session: string,
  username: string
): Promise<GalleryUsernameCheck> =>
  request(`/usernames/${encodeURIComponent(username)}`, { session });

/**
 * The account's live and hidden styles, most recently updated first.
 */
export const getMyStyles = async (
  session: string
): Promise<Array<GalleryStyle>> => {
  const { styles } = await request<{ styles: Array<GalleryStyle> }>(
    '/me/styles',
    { session }
  );

  return styles;
};

export const publishStyle = (
  session: string,
  site: string,
  form: StyleForm
): Promise<GalleryPublishedStyle> =>
  request('/styles', {
    method: 'POST',
    session,
    form: toFormData(form, site),
  });

/**
 * Publishes a new version of one of the account's styles, replacing its name
 * and description too. The gallery refuses one whose CSS is unchanged, with
 * the code CSS_UNCHANGED.
 */
export const publishVersion = (
  session: string,
  id: number,
  form: StyleForm
): Promise<GalleryPublishedStyle> =>
  request(`/styles/${id}/versions`, {
    method: 'POST',
    session,
    form: toFormData(form),
  });

/**
 * Edits one of the account's styles' name, description or screenshot
 * without a new version, so installs don't get an update.
 */
export const editStyle = (
  session: string,
  id: number,
  form: StyleDetailsForm
): Promise<GalleryPublishedStyle> =>
  request(`/styles/${id}`, {
    method: 'PATCH',
    session,
    form: toDetailsFormData(form),
  });

/**
 * Takes one of the account's styles out of the gallery; the website can
 * publish it again or delete it for good.
 */
export const unpublishStyle = (session: string, id: number): Promise<void> =>
  request(`/styles/${id}/unpublish`, {
    method: 'POST',
    session,
  });

/**
 * A page of styles; nextOffset is null on the last one.
 */
export type GalleryStylesPage = {
  styles: Array<GalleryStyle>;
  nextOffset: number | null;
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
