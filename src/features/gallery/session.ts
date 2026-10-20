import {
  clearGoogleToken,
  getGoogleToken,
  signOutOfGoogle,
  type GoogleAccess,
} from '@stylebot/google-auth';
import type { GalleryAccount } from '@stylebot/types';

import { createSession, type GallerySession } from './api';
import { isGalleryApiError } from './request';

const SESSION_KEY = 'gallery-session';

// Retire the session a day early rather than have a publish turned down.
const EXPIRY_SKEW_MS = 24 * 60 * 60 * 1000;

// The profile scope lets a new account's username come from their name.
const GOOGLE_ACCESS: GoogleAccess = {
  scopes: ['openid', 'https://www.googleapis.com/auth/userinfo.profile'],
  cacheKey: 'google-identity-access-token',
  refreshTokenKey: 'google-identity-refresh-token',
};

export const getStoredSession = async (): Promise<GallerySession | null> => {
  const stored: GallerySession | undefined = (
    await chrome.storage.local.get(SESSION_KEY)
  )[SESSION_KEY];

  // Sessions from before usernames have none, and need a new sign-in.
  if (
    !stored?.account?.username ||
    stored.expiresAt - EXPIRY_SKEW_MS <= Date.now()
  ) {
    return null;
  }

  return stored;
};

export const getSignedInAccount = async (): Promise<GalleryAccount | null> =>
  (await getStoredSession())?.account ?? null;

const storeSession = (session: GallerySession): Promise<void> =>
  chrome.storage.local.set({ [SESSION_KEY]: session });

export const clearSession = (): Promise<void> =>
  chrome.storage.local.remove(SESSION_KEY);

/**
 * Keeps the stored session's account in step after it changes, such as a new
 * username.
 */
export const storeAccount = async (account: GalleryAccount): Promise<void> => {
  const stored = await getStoredSession();

  if (stored) {
    await storeSession({ ...stored, account });
  }
};

/**
 * Signs in to the gallery with a Google token, trying a fresh one once when
 * the gallery turns it down, since Google can revoke a cached token early.
 */
export const signIn = async (): Promise<GallerySession> => {
  let session: GallerySession;

  try {
    session = await createSession(await getGoogleToken(GOOGLE_ACCESS));
  } catch (e) {
    if (!isGalleryApiError(e) || e.status !== 401) {
      throw e;
    }

    await clearGoogleToken(GOOGLE_ACCESS);
    session = await createSession(await getGoogleToken(GOOGLE_ACCESS));
  }

  await storeSession(session);
  return session;
};

/**
 * Forgets the gallery session and the Google tokens behind it, leaving Drive
 * sync's own sign-in alone.
 */
export const signOut = async (): Promise<void> => {
  await Promise.all([clearSession(), signOutOfGoogle(GOOGLE_ACCESS)]);
};

/**
 * Runs a request with the stored session, signing in first when there's none,
 * and again when the gallery reports the session expired.
 */
export const withSession = async <T>(
  run: (session: string) => Promise<T>
): Promise<T> => {
  const stored = (await getStoredSession()) ?? (await signIn());

  try {
    return await run(stored.session);
  } catch (e) {
    if (!isGalleryApiError(e) || e.status !== 401) {
      throw e;
    }

    await clearSession();
    return run((await signIn()).session);
  }
};
