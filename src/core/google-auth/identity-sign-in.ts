import { googleAuthError } from './errors';
import {
  getAuthURL,
  getRandomString,
  requestToken,
  getIssuedToken,
  type IssuedToken,
} from './desktop-client';

/**
 * Whether the identity API can finish a sign-in on a loopback address, the
 * only redirect Google takes from a Desktop client. Firefox can; Chrome only
 * finishes on its chromiumapp.org address.
 */
export const usesIdentitySignIn = (): boolean =>
  Boolean(chrome.identity?.launchWebAuthFlow) &&
  chrome.runtime.getURL('').startsWith('moz-extension:');

/**
 * Firefox's loopback form of the identity redirect, which it intercepts
 * before anything loads.
 */
const getRedirectURI = (): string => {
  const [subdomain] = new URL(chrome.identity.getRedirectURL()).hostname.split(
    '.'
  );
  return `http://127.0.0.1/mozoauth2/${subdomain}`;
};

/**
 * Wraps the callback API: @types/chrome has no promise overload for
 * launchWebAuthFlow.
 */
const launchWebAuthFlow = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { interactive: true, url },
      responseURL => {
        const lastError = chrome.runtime.lastError;

        if (lastError || !responseURL) {
          reject(
            googleAuthError(
              lastError?.message ?? 'Authorization failure',
              'sign-in'
            )
          );
          return;
        }

        resolve(responseURL);
      }
    );
  });

/**
 * Signs in to Google in the browser's auth window and keeps the refresh
 * token under `refreshTokenKey`, so later runs get access tokens without the
 * user.
 */
export const signInWithIdentityAPI = async (
  scopes: Array<string>,
  refreshTokenKey: string
): Promise<IssuedToken> => {
  const verifier = getRandomString();
  const state = getRandomString();
  const redirectURI = getRedirectURI();

  const redirect = new URL(
    await launchWebAuthFlow(
      await getAuthURL({ scopes, redirectURI, verifier, state })
    )
  );
  const code = redirect.searchParams.get('code');

  if (redirect.searchParams.get('state') !== state || !code) {
    throw googleAuthError(
      `Authorization failure: ${
        redirect.searchParams.get('error') ?? 'no code'
      }`,
      'sign-in'
    );
  }

  const json = await requestToken({
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,
    redirect_uri: redirectURI,
  });
  const issued = getIssuedToken(json);

  if (!json.refresh_token || !issued) {
    throw googleAuthError(
      `Authorization failure: ${json.error ?? 'no refresh token'}`,
      'sign-in'
    );
  }

  await chrome.storage.local.set({ [refreshTokenKey]: json.refresh_token });
  return issued;
};
