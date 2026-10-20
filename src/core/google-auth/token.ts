// Code from https://github.com/mdn/webextensions-examples/tree/master/google-userinfo
import { googleAuthError, isUnavailable } from './errors';
import {
  DESKTOP_CLIENT_ID,
  refreshAccessToken,
  type IssuedToken,
} from './desktop-client';
import { signInWithIdentityAPI, usesIdentitySignIn } from './identity-sign-in';
import { signInWithRedirectRule } from './redirect-rule-sign-in';

export type AccessToken = string;

/**
 * What a sign-in asks Google for, and where its tokens are kept, so each
 * sign-in and sign-out leaves the others alone.
 */
export type GoogleAccess = {
  scopes: Array<string>;
  cacheKey: string;
  refreshTokenKey: string;
};

// Retire the token a minute early so a request started just under the wire
// does not fail halfway through with a 401.
const EXPIRY_SKEW_MS = 60 * 1000;

type CachedToken = { token: AccessToken; expiresAt: number };

const getCachedToken = async (
  cacheKey: string
): Promise<AccessToken | null> => {
  const items = await chrome.storage.local.get(cacheKey);
  const cached: CachedToken | undefined = items[cacheKey];

  if (!cached || cached.expiresAt <= Date.now()) {
    return null;
  }

  return cached.token;
};

export const cacheGoogleToken = (
  cacheKey: string,
  token: AccessToken,
  expiresIn: number
): Promise<void> => {
  const expiresAt = Date.now() + expiresIn * 1000 - EXPIRY_SKEW_MS;
  return chrome.storage.local.set({ [cacheKey]: { token, expiresAt } });
};

export const clearGoogleToken = ({ cacheKey }: GoogleAccess): Promise<void> =>
  chrome.storage.local.remove(cacheKey);

/**
 * Forgets the access and refresh tokens, so the next sign-in asks Google
 * again and can pick another account.
 */
export const signOutOfGoogle = ({
  cacheKey,
  refreshTokenKey,
}: GoogleAccess): Promise<void> =>
  chrome.storage.local.remove([cacheKey, refreshTokenKey]);

/**
 * Checks with Google's tokeninfo endpoint that the token was issued to
 * `clientId`, which it reports as `aud`.
 */
export const validateGoogleToken = async (
  token: AccessToken,
  clientId: string
): Promise<void> => {
  const validationBaseURL = 'https://www.googleapis.com/oauth2/v3/tokeninfo';
  const response = await fetch(`${validationBaseURL}?access_token=${token}`, {
    method: 'GET',
  });

  if (isUnavailable(response.status)) {
    throw googleAuthError(
      `Token validation unavailable (${response.status})`,
      'network'
    );
  }

  if (response.status !== 200) {
    throw googleAuthError('Token validation error', 'sign-in');
  }

  const json: { aud?: string } = await response.json();

  if (json.aud !== clientId) {
    throw googleAuthError('Token validation error', 'sign-in');
  }
};

const keepIssuedToken = async (
  { cacheKey }: GoogleAccess,
  issued: IssuedToken
): Promise<AccessToken> => {
  await validateGoogleToken(issued.token, DESKTOP_CLIENT_ID);
  await cacheGoogleToken(cacheKey, issued.token, issued.expiresIn);

  return issued.token;
};

/**
 * Resolves a token without the user: the cached one, else one from the stored
 * refresh token. Resolves null when neither is there.
 */
export const getStoredGoogleToken = async (
  access: GoogleAccess
): Promise<AccessToken | null> => {
  const cached = await getCachedToken(access.cacheKey);

  if (cached) {
    return cached;
  }

  const refreshed = await refreshAccessToken(access.refreshTokenKey);

  if (!refreshed) {
    return null;
  }

  return keepIssuedToken(access, refreshed);
};

/**
 * Signs in with the browser's auth window where it can finish one, else in a
 * tab, keeping the refresh token so later calls don't need the user.
 */
export const signInToGoogle = async (
  access: GoogleAccess
): Promise<AccessToken> => {
  const { scopes, refreshTokenKey } = access;
  const issued = usesIdentitySignIn()
    ? await signInWithIdentityAPI(scopes, refreshTokenKey)
    : await signInWithRedirectRule(scopes, refreshTokenKey);

  return keepIssuedToken(access, issued);
};

/**
 * Resolves a usable token, signing in when there's none stored.
 */
export const getGoogleToken = async (
  access: GoogleAccess
): Promise<AccessToken> => {
  const stored = await getStoredGoogleToken(access);

  return stored ?? signInToGoogle(access);
};
