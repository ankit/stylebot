import type {
  GalleryAuthor,
  GalleryPublishedStyle,
  GalleryStyle,
} from '@stylebot/types';

import { request } from './request';
import { toFormData, type StyleForm } from './to-form-data';

/**
 * A signed-in session: the token sent as a bearer on requests that need an
 * account, when it expires, and whose account it is.
 */
export type GallerySession = {
  session: string;
  expiresAt: number;
  account: GalleryAuthor;
};

/**
 * Trades a Google access token from Drive sign-in for a gallery session.
 */
export const createSession = (googleToken: string): Promise<GallerySession> =>
  request('/session', { method: 'POST', json: { googleToken } });

/**
 * Sets the alias shown as the author of the account's styles; an empty one
 * clears it, leaving them anonymous.
 */
export const setDisplayName = (
  session: string,
  name: string
): Promise<GalleryAuthor> =>
  request('/me', { method: 'PATCH', session, json: { name: name || null } });

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
 * and description too.
 */
export const publishVersion = (
  session: string,
  id: string,
  form: StyleForm
): Promise<GalleryPublishedStyle> =>
  request(`/styles/${encodeURIComponent(id)}/versions`, {
    method: 'POST',
    session,
    form: toFormData(form),
  });

export const unpublishStyle = (session: string, id: string): Promise<void> =>
  request(`/styles/${encodeURIComponent(id)}`, { method: 'DELETE', session });
