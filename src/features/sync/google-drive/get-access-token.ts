import {
  cacheGoogleToken,
  clearGoogleToken,
  getStoredGoogleToken,
  signInToGoogle,
  validateGoogleToken,
  type AccessToken,
  type GoogleAccess,
} from '@stylebot/google-auth';

import { syncError } from '../errors';

const DRIVE_ACCESS: GoogleAccess = {
  scopes: ['https://www.googleapis.com/auth/drive.file'],
  cacheKey: 'google-drive-access-token',
  refreshTokenKey: 'google-drive-refresh-token',
};

const WEB_CLIENT_ID =
  '662998053209-s49tq55ic3td87m08gi8vpjqm5t7r9st.apps.googleusercontent.com';

export const clearCachedToken = (): Promise<void> =>
  clearGoogleToken(DRIVE_ACCESS);

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
 * Wraps the callback API: @types/chrome has no promise overload for
 * launchWebAuthFlow, unlike the storage calls elsewhere in sync.
 */
const authorizeSilently = (): Promise<string | undefined> => {
  return new Promise((resolve, reject) => {
    const redirectURL = chrome.identity.getRedirectURL();

    let authURL = 'https://accounts.google.com/o/oauth2/auth';
    authURL += `?client_id=${WEB_CLIENT_ID}`;
    authURL += `&response_type=token`;
    authURL += `&redirect_uri=${encodeURIComponent(redirectURL)}`;
    authURL += `&scope=${encodeURIComponent(DRIVE_ACCESS.scopes.join(' '))}`;

    chrome.identity.launchWebAuthFlow(
      { interactive: false, url: authURL },
      responseURL => {
        // Set when the flow needs the user, such as to pick an account.
        // Leaving it unread also makes Chrome log an unchecked-lastError
        // warning.
        const lastError = chrome.runtime.lastError;

        if (lastError) {
          reject(
            syncError(lastError.message ?? 'Authorization failure', 'sign-in')
          );
          return;
        }

        resolve(responseURL);
      }
    );
  });
};

/**
 * Renews a token for the web client profiles signed in to before refresh
 * tokens, until their next interactive sync signs them in again. It only works
 * while Google can finish without the user.
 */
const renewWebClientToken = async (): Promise<AccessToken> => {
  const params = extractTokenParams((await authorizeSilently()) ?? '');

  if (!params) {
    throw syncError('Authorization failure', 'sign-in');
  }

  await validateGoogleToken(params.token, WEB_CLIENT_ID);
  await cacheGoogleToken(DRIVE_ACCESS.cacheKey, params.token, params.expiresIn);

  return params.token;
};

/**
 * Resolves a usable token: the cached one, else one from the stored refresh
 * token. Only an interactive run signs in; a scheduled one falls back to the
 * web client's silent renewal where the identity API has it.
 */
export default async (
  { interactive }: { interactive: boolean } = { interactive: true }
): Promise<AccessToken> => {
  const stored = await getStoredGoogleToken(DRIVE_ACCESS);

  if (stored) {
    return stored;
  }

  if (interactive) {
    return signInToGoogle(DRIVE_ACCESS);
  }

  // Safari has no identity API.
  if (typeof chrome.identity?.launchWebAuthFlow === 'function') {
    return renewWebClientToken();
  }

  throw syncError('Sign-in needed', 'sign-in');
};
