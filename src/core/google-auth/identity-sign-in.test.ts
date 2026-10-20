import fetchMock from 'jest-fetch-mock';

import { DESKTOP_CLIENT_ID } from './desktop-client';
import { signInWithIdentityAPI, usesIdentitySignIn } from './identity-sign-in';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const REFRESH_TOKEN_KEY = 'drive-refresh-token';
const REDIRECT_URI = 'http://127.0.0.1/mozoauth2/abc123';

let store: Record<string, unknown>;
let tokenRequests: Array<URLSearchParams>;
let tokenResponse: Record<string, unknown>;
let respond: (authURL: URL) => { url?: string; lastError?: string };
let launchWebAuthFlow: jest.Mock;

const mockChrome = (extensionURL = 'moz-extension://xyz/') => {
  launchWebAuthFlow = jest.fn(
    (
      { url }: { interactive: boolean; url: string },
      callback: (responseURL?: string) => void
    ) => {
      const { url: responseURL, lastError } = respond(new URL(url));
      (global.chrome.runtime as { lastError?: unknown }).lastError = lastError
        ? { message: lastError }
        : undefined;
      callback(responseURL);
      (global.chrome.runtime as { lastError?: unknown }).lastError = undefined;
    }
  );

  global.chrome = {
    runtime: {
      lastError: undefined,
      getURL: (path: string) => `${extensionURL}${path}`,
    },
    identity: {
      getRedirectURL: () => 'https://abc123.extensions.allizom.org/',
      launchWebAuthFlow,
    },
    storage: {
      local: {
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
      },
    },
  } as unknown as typeof chrome;
};

/**
 * Google sending the browser back with a code for the sign-in it was given.
 */
const approve = (authURL: URL) => ({
  url: `${REDIRECT_URI}?state=${authURL.searchParams.get('state')}&code=c-1`,
});

beforeEach(() => {
  store = {};
  tokenRequests = [];
  tokenResponse = {
    access_token: 'first',
    expires_in: 3600,
    refresh_token: 'r-1',
  };
  respond = approve;
  fetchMock.resetMocks();
  fetchMock.mockResponse(async request => {
    tokenRequests.push(new URLSearchParams(await request.text()));
    return JSON.stringify(tokenResponse);
  });
  mockChrome();
});

describe('usesIdentitySignIn', () => {
  it('is on for Firefox and off for Chrome', () => {
    expect(usesIdentitySignIn()).toBe(true);

    mockChrome('chrome-extension://xyz/');
    expect(usesIdentitySignIn()).toBe(false);
  });
});

describe('signInWithIdentityAPI', () => {
  it('signs in with PKCE on the loopback redirect and keeps the refresh token', async () => {
    await expect(
      signInWithIdentityAPI(SCOPES, REFRESH_TOKEN_KEY)
    ).resolves.toEqual({
      token: 'first',
      expiresIn: 3600,
    });

    const [[options]] = launchWebAuthFlow.mock.calls;
    const auth = new URL(options.url);

    expect(options.interactive).toBe(true);
    expect(auth.searchParams.get('client_id')).toBe(DESKTOP_CLIENT_ID);
    expect(auth.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
    expect(auth.searchParams.get('response_type')).toBe('code');
    expect(auth.searchParams.get('code_challenge_method')).toBe('S256');
    expect(auth.searchParams.get('access_type')).toBe('offline');

    expect(tokenRequests[0].get('grant_type')).toBe('authorization_code');
    expect(tokenRequests[0].get('code')).toBe('c-1');
    expect(tokenRequests[0].get('redirect_uri')).toBe(REDIRECT_URI);
    expect(tokenRequests[0].get('code_verifier')).toBeTruthy();
    expect(store[REFRESH_TOKEN_KEY]).toBe('r-1');
  });

  it('rejects when the user closes the auth window', async () => {
    respond = () => ({ lastError: 'User cancelled or denied access.' });

    await expect(
      signInWithIdentityAPI(SCOPES, REFRESH_TOKEN_KEY)
    ).rejects.toMatchObject({
      code: 'sign-in',
      message: 'User cancelled or denied access.',
    });
    expect(tokenRequests).toHaveLength(0);
  });

  it('ignores a redirect for another sign-in', async () => {
    respond = () => ({ url: `${REDIRECT_URI}?state=other&code=c-1` });

    await expect(
      signInWithIdentityAPI(SCOPES, REFRESH_TOKEN_KEY)
    ).rejects.toMatchObject({
      code: 'sign-in',
    });
    expect(tokenRequests).toHaveLength(0);
  });

  it("fails with Google's reason when it sends back no code", async () => {
    respond = authURL => ({
      url: `${REDIRECT_URI}?state=${authURL.searchParams.get(
        'state'
      )}&error=access_denied`,
    });

    await expect(
      signInWithIdentityAPI(SCOPES, REFRESH_TOKEN_KEY)
    ).rejects.toThrow('Authorization failure: access_denied');
  });

  it('fails without keeping anything when no refresh token comes back', async () => {
    tokenResponse = { error: 'invalid_grant' };

    await expect(
      signInWithIdentityAPI(SCOPES, REFRESH_TOKEN_KEY)
    ).rejects.toThrow('Authorization failure: invalid_grant');
    expect(store[REFRESH_TOKEN_KEY]).toBeUndefined();
  });
});
