import fetchMock from 'jest-fetch-mock';

import { signInToGoogle } from '@stylebot/google-auth';

import getAccessToken, { clearCachedToken } from './get-access-token';
import { isSyncError } from '../errors';

jest.mock('@stylebot/google-auth', () => ({
  ...jest.requireActual('@stylebot/google-auth'),
  signInToGoogle: jest.fn(),
}));

const DESKTOP_CLIENT_ID =
  '662998053209-uqalajpc4ei0nvdk164lmul35nbeocas.apps.googleusercontent.com';

const WEB_CLIENT_ID =
  '662998053209-s49tq55ic3td87m08gi8vpjqm5t7r9st.apps.googleusercontent.com';

const CACHE_KEY = 'google-drive-access-token';
const REFRESH_TOKEN_KEY = 'google-drive-refresh-token';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

type FlowResult = { url?: string; lastError?: { message: string } };

let store: Record<string, unknown>;
let flows: Array<FlowResult>;
let launchWebAuthFlow: jest.Mock;

const mockChrome = () => {
  launchWebAuthFlow = jest.fn(
    (
      _options: { interactive: boolean; url: string },
      callback: (responseURL?: string) => void
    ) => {
      const next = flows.shift() ?? {
        lastError: { message: 'no flow queued' },
      };
      (global.chrome.runtime as { lastError?: unknown }).lastError =
        next.lastError;
      callback(next.url);
      (global.chrome.runtime as { lastError?: unknown }).lastError = undefined;
    }
  );

  global.chrome = {
    runtime: {
      lastError: undefined,
      getURL: (path: string) => `chrome-extension://abc/${path}`,
    },
    identity: {
      getRedirectURL: () => 'https://abc.chromiumapp.org/',
      launchWebAuthFlow,
    },
    storage: {
      local: {
        get: jest.fn(async (key: string) => ({ [key]: store[key] })),
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
        remove: jest.fn(async (key: string) => {
          delete store[key];
        }),
      },
    },
  } as unknown as typeof chrome;
};

const redirectWith = (token: string, expiresIn = 3600) =>
  `https://abc.chromiumapp.org/#access_token=${token}&expires_in=${expiresIn}&token_type=Bearer`;

/**
 * Answers token refreshes with `refreshed` and tokeninfo with the client the
 * token belongs to.
 */
const mockGoogle = ({
  refreshed,
  aud = WEB_CLIENT_ID,
}: {
  refreshed?: Record<string, unknown>;
  aud?: string;
}) =>
  fetchMock.mockResponse(async request =>
    request.url === TOKEN_URL
      ? JSON.stringify(refreshed ?? {})
      : JSON.stringify({ aud })
  );

const interactiveFlows = () =>
  launchWebAuthFlow.mock.calls.filter(([options]) => options.interactive);

beforeEach(() => {
  store = {};
  flows = [];
  fetchMock.resetMocks();
  jest.mocked(signInToGoogle).mockReset();
  mockChrome();
});

describe('getAccessToken', () => {
  it('reuses a cached token without starting an auth flow', async () => {
    store[CACHE_KEY] = { token: 'cached', expiresAt: Date.now() + 60_000 };

    await expect(getAccessToken()).resolves.toBe('cached');
    expect(launchWebAuthFlow).not.toBeCalled();
    expect(fetchMock).not.toBeCalled();
  });

  it('gets a new token from the refresh token, with no auth flow', async () => {
    store[CACHE_KEY] = { token: 'stale', expiresAt: Date.now() - 1 };
    store[REFRESH_TOKEN_KEY] = 'refresh-1';
    mockGoogle({
      refreshed: { access_token: 'fresh', expires_in: 1800 },
      aud: DESKTOP_CLIENT_ID,
    });

    const before = Date.now();
    await expect(getAccessToken({ interactive: false })).resolves.toBe('fresh');

    expect(launchWebAuthFlow).not.toBeCalled();
    expect(signInToGoogle).not.toBeCalled();

    const cached = store[CACHE_KEY] as { token: string; expiresAt: number };
    expect(cached.token).toBe('fresh');
    // 1800s minus the 60s skew.
    expect(cached.expiresAt).toBeGreaterThanOrEqual(before + 1740_000 - 1000);
    expect(cached.expiresAt).toBeLessThanOrEqual(Date.now() + 1740_000);
  });

  it('signs in to Drive when an interactive run has no refresh token', async () => {
    jest.mocked(signInToGoogle).mockResolvedValue('signed-in');

    await expect(getAccessToken()).resolves.toBe('signed-in');

    expect(signInToGoogle).toBeCalledWith({
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      cacheKey: CACHE_KEY,
      refreshTokenKey: REFRESH_TOKEN_KEY,
    });
    expect(launchWebAuthFlow).not.toBeCalled();
  });

  it('falls back to the web client silently when a scheduled run has no refresh token', async () => {
    flows = [{ url: redirectWith('silent') }];
    mockGoogle({});

    await expect(getAccessToken({ interactive: false })).resolves.toBe(
      'silent'
    );

    expect(launchWebAuthFlow).toBeCalledTimes(1);
    expect(interactiveFlows()).toHaveLength(0);
    expect(signInToGoogle).not.toBeCalled();
  });

  it('asks for a sign-in without opening anything when the fallback needs the user', async () => {
    flows = [{ lastError: { message: 'User interaction required.' } }];

    const error = await getAccessToken({ interactive: false }).catch(e => e);

    expect(error).toBeInstanceOf(Error);
    expect(isSyncError(error)).toBe(true);
    expect(error.code).toBe('sign-in');
    expect(error.message).toBe('User interaction required.');
    expect(interactiveFlows()).toHaveLength(0);
    expect(signInToGoogle).not.toBeCalled();
  });

  it('falls back to the web client once Google stops honouring the refresh token', async () => {
    store[REFRESH_TOKEN_KEY] = 'revoked';
    flows = [{ url: redirectWith('silent') }];
    fetchMock.mockResponse(async request =>
      request.url === TOKEN_URL
        ? JSON.stringify({ error: 'invalid_grant' })
        : JSON.stringify({ aud: WEB_CLIENT_ID })
    );

    await expect(getAccessToken({ interactive: false })).resolves.toBe(
      'silent'
    );
    expect(store[REFRESH_TOKEN_KEY]).toBeUndefined();
  });

  it('rejects when the redirect carries no access token', async () => {
    flows = [{ url: 'https://abc.chromiumapp.org/#error=access_denied' }];

    await expect(getAccessToken({ interactive: false })).rejects.toMatchObject({
      code: 'sign-in',
    });
  });

  it('rejects and does not cache when the token fails validation', async () => {
    flows = [{ url: redirectWith('wrong') }];
    mockGoogle({ aud: 'someone-else' });

    await expect(getAccessToken({ interactive: false })).rejects.toMatchObject({
      code: 'sign-in',
    });
    expect(store[CACHE_KEY]).toBeUndefined();
  });

  it('reports a network error when the tokeninfo endpoint is down', async () => {
    flows = [{ url: redirectWith('token') }];
    fetchMock.mockResponse('{}', { status: 500 });

    await expect(getAccessToken({ interactive: false })).rejects.toMatchObject({
      code: 'network',
    });
  });

  it('asks for a sign-in when the tokeninfo endpoint rejects the token', async () => {
    flows = [{ url: redirectWith('token') }];
    fetchMock.mockResponse('{}', { status: 400 });

    await expect(getAccessToken({ interactive: false })).rejects.toMatchObject({
      code: 'sign-in',
    });
  });
});

describe('clearCachedToken', () => {
  it('removes the cached token so the next call re-authorizes', async () => {
    store[CACHE_KEY] = { token: 'cached', expiresAt: Date.now() + 60_000 };

    await clearCachedToken();

    expect(store[CACHE_KEY]).toBeUndefined();
  });
});
