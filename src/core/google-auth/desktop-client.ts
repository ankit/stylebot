import { googleAuthError, isUnavailable } from './errors';

export const DESKTOP_CLIENT_ID =
  '662998053209-uqalajpc4ei0nvdk164lmul35nbeocas.apps.googleusercontent.com';

// Set at build time so it stays out of the repo; Google treats a Desktop
// client's secret as public, since it ships in every copy of the extension.
const DESKTOP_CLIENT_SECRET = process.env.STYLEBOT_GOOGLE_CLIENT_SECRET ?? '';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export type IssuedToken = { token: string; expiresIn: number };

export type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

const base64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export const getRandomString = (): string =>
  base64Url(crypto.getRandomValues(new Uint8Array(32)));

const getCodeChallenge = async (verifier: string): Promise<string> =>
  base64Url(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
    )
  );

export const requestToken = async (
  params: Record<string, string>
): Promise<TokenResponse> => {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: DESKTOP_CLIENT_ID,
      client_secret: DESKTOP_CLIENT_SECRET,
      ...params,
    }),
  });

  if (isUnavailable(response.status)) {
    throw googleAuthError(
      `Google sign-in unavailable (${response.status})`,
      'network'
    );
  }

  return response.json();
};

export const getIssuedToken = (json: TokenResponse): IssuedToken | null =>
  json.access_token
    ? {
        token: json.access_token,
        expiresIn:
          json.expires_in && json.expires_in > 0 ? json.expires_in : 3600,
      }
    : null;

/**
 * Trades the refresh token stored under `refreshTokenKey` for a new access
 * token, without the user. Resolves null when there's none, or Google no
 * longer honours it.
 */
export const refreshAccessToken = async (
  refreshTokenKey: string
): Promise<IssuedToken | null> => {
  const items = await chrome.storage.local.get(refreshTokenKey);
  const refreshToken: string | undefined = items[refreshTokenKey];

  if (!refreshToken) {
    return null;
  }

  const json = await requestToken({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  if (json.error) {
    console.error(
      'Google token refresh failed:',
      json.error,
      json.error_description
    );
  }

  if (json.error === 'invalid_grant') {
    await chrome.storage.local.remove(refreshTokenKey);
  }

  return getIssuedToken(json);
};

/**
 * Google's consent page for the Desktop client, with PKCE, asking for the
 * offline access that brings a refresh token.
 */
export const getAuthURL = async ({
  scopes,
  redirectURI,
  verifier,
  state,
}: {
  scopes: Array<string>;
  redirectURI: string;
  verifier: string;
  state: string;
}): Promise<string> => {
  const authURL = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authURL.search = new URLSearchParams({
    client_id: DESKTOP_CLIENT_ID,
    redirect_uri: redirectURI,
    response_type: 'code',
    scope: scopes.join(' '),
    code_challenge: await getCodeChallenge(verifier),
    code_challenge_method: 'S256',
    state,
    // A refresh token only comes with offline access, and on a repeat
    // sign-in only when the consent screen is shown again.
    access_type: 'offline',
    prompt: 'consent',
  }).toString();

  return authURL.toString();
};
