// Code from https://github.com/mdn/webextensions-examples/tree/master/google-userinfo
import { syncError } from '../errors';

export type AccessToken = string;

const CLIENT_ID =
  '662998053209-s49tq55ic3td87m08gi8vpjqm5t7r9st.apps.googleusercontent.com';

const CACHE_KEY = 'google-drive-access-token';

// Retire the token a minute early so a sync started just under the wire does
// not fail halfway through with a 401.
const EXPIRY_SKEW_MS = 60 * 1000;

type CachedToken = { token: AccessToken; expiresAt: number };

const getCachedToken = async (): Promise<AccessToken | null> => {
  const items = await chrome.storage.local.get(CACHE_KEY);
  const cached: CachedToken | undefined = items[CACHE_KEY];

  if (!cached || cached.expiresAt <= Date.now()) {
    return null;
  }

  return cached.token;
};

const setCachedToken = (
  token: AccessToken,
  expiresIn: number
): Promise<void> => {
  const expiresAt = Date.now() + expiresIn * 1000 - EXPIRY_SKEW_MS;
  return chrome.storage.local.set({ [CACHE_KEY]: { token, expiresAt } });
};

export const clearCachedToken = (): Promise<void> =>
  chrome.storage.local.remove(CACHE_KEY);

const extractTokenParams = (redirectUri: string) => {
  const m = redirectUri.match(/[#?](.*)/);

  if (!m || m.length < 1) {
    return null;
  }

  const params = new URLSearchParams(m[1].split('#')[0]);
  const token = params.get('access_token');

  if (!token) {
    return null;
  }

  // Google's default is an hour; fall back to that when it is not sent.
  const expiresIn = Number(params.get('expires_in'));

  return {
    token,
    expiresIn: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600,
  };
};

/**
 * Validate the token contained in redirectURL.
 * This follows essentially the process here:
 * https://developers.google.com/identity/protocols/OAuth2UserAgent#tokeninfo-validation
 * - make a GET request to the validation URL, including the access token
 * - if the response is 200, and contains an "aud" property, and that property
 * matches the clientID, then the response is valid
 * - otherwise it is not valid
 * Note that the Google page talks about an "audience" property, but in fact
 * it seems to be "aud".
 */
const validate = async (token: AccessToken): Promise<void> => {
  const validationBaseURL = 'https://www.googleapis.com/oauth2/v3/tokeninfo';
  const response = await fetch(`${validationBaseURL}?access_token=${token}`, {
    method: 'GET',
  });

  if (response.status !== 200) {
    throw syncError('Token validation error', 'auth');
  }

  const json: { aud?: string } = await response.json();

  if (json.aud !== CLIENT_ID) {
    throw syncError('Token validation error', 'auth');
  }
};

/**
 * Wraps the callback API: @types/chrome has no promise overload for
 * launchWebAuthFlow, unlike the storage calls elsewhere in sync.
 */
const authorize = (interactive: boolean): Promise<string | undefined> => {
  return new Promise((resolve, reject) => {
    const redirectURL = chrome.identity.getRedirectURL();
    const scopes = ['https://www.googleapis.com/auth/drive.file'];

    let authURL = 'https://accounts.google.com/o/oauth2/auth';
    authURL += `?client_id=${CLIENT_ID}`;
    authURL += `&response_type=token`;
    authURL += `&redirect_uri=${encodeURIComponent(redirectURL)}`;
    authURL += `&scope=${encodeURIComponent(scopes.join(' '))}`;

    chrome.identity.launchWebAuthFlow(
      { interactive, url: authURL },
      responseURL => {
        // Set when the user closes the auth window, and when a
        // non-interactive flow needs consent. Leaving it unread also makes
        // Chrome log an unchecked-lastError warning.
        const lastError = chrome.runtime.lastError;

        if (lastError) {
          reject(
            syncError(lastError.message ?? 'Authorization failure', 'auth')
          );
          return;
        }

        resolve(responseURL);
      }
    );
  });
};

const authorizeAndCache = async (
  interactive: boolean
): Promise<AccessToken> => {
  const params = extractTokenParams((await authorize(interactive)) ?? '');

  if (!params) {
    throw syncError('Authorization failure', 'auth');
  }

  await validate(params.token);
  await setCachedToken(params.token, params.expiresIn);

  return params.token;
};

/**
 * Resolves a usable token, preferring the cache and then a silent flow, so a
 * routine sync does not raise an auth window on every run.
 */
export default async (
  { interactive }: { interactive: boolean } = { interactive: true }
): Promise<AccessToken> => {
  const cached = await getCachedToken();

  if (cached) {
    return cached;
  }

  try {
    return await authorizeAndCache(false);
  } catch (e) {
    if (!interactive) {
      throw e;
    }
  }

  return authorizeAndCache(true);
};
