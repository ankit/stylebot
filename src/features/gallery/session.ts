import type { GalleryAuthor } from '@stylebot/types';

import { createSession, type GallerySession } from './api';
import { isGalleryApiError } from './request';

const SESSION_KEY = 'gallery-session';

// Retire the session a day early rather than have a publish turned down.
const EXPIRY_SKEW_MS = 24 * 60 * 60 * 1000;

/**
 * Where gallery sign-in gets a Google access token: Drive sync's sign-in,
 * passed in since features don't import each other.
 */
export type GoogleTokenSource = {
  getToken(): Promise<string>;
  clearToken(): Promise<void>;
};

export const getStoredSession = async (): Promise<GallerySession | null> => {
  const stored: GallerySession | undefined = (
    await chrome.storage.local.get(SESSION_KEY)
  )[SESSION_KEY];

  if (!stored || stored.expiresAt - EXPIRY_SKEW_MS <= Date.now()) {
    return null;
  }

  return stored;
};

export const getSignedInAccount = async (): Promise<GalleryAuthor | null> =>
  (await getStoredSession())?.account ?? null;

const storeSession = (session: GallerySession): Promise<void> =>
  chrome.storage.local.set({ [SESSION_KEY]: session });

export const clearSession = (): Promise<void> =>
  chrome.storage.local.remove(SESSION_KEY);

/**
 * Keeps the stored session's account in step after it changes, such as a new
 * alias.
 */
export const storeAccount = async (account: GalleryAuthor): Promise<void> => {
  const stored = await getStoredSession();

  if (stored) {
    await storeSession({ ...stored, account });
  }
};

/**
 * Signs in to the gallery with a Google token, trying a fresh one once when
 * the gallery turns it down, since Google can revoke a cached token early.
 */
export const signIn = async (
  google: GoogleTokenSource
): Promise<GallerySession> => {
  let session: GallerySession;

  try {
    session = await createSession(await google.getToken());
  } catch (e) {
    if (!isGalleryApiError(e) || e.status !== 401) {
      throw e;
    }

    await google.clearToken();
    session = await createSession(await google.getToken());
  }

  await storeSession(session);
  return session;
};

/**
 * Runs a request with the stored session, signing in first when there's none,
 * and again when the gallery reports the session expired.
 */
export const withSession = async <T>(
  google: GoogleTokenSource,
  run: (session: string) => Promise<T>
): Promise<T> => {
  const stored = (await getStoredSession()) ?? (await signIn(google));

  try {
    return await run(stored.session);
  } catch (e) {
    if (!isGalleryApiError(e) || e.status !== 401) {
      throw e;
    }

    await clearSession();
    return run((await signIn(google)).session);
  }
};
