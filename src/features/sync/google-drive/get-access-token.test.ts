import fetchMock from 'jest-fetch-mock';

import getAccessToken, {
  clearCachedToken,
  getIdentityAccessToken,
} from './get-access-token';
import { DESKTOP_CLIENT_ID, REFRESH_TOKEN_KEY } from './desktop-client';
import { signInWithIdentityAPI } from './identity-sign-in';
import { signInWithRedirectRule } from './redirect-rule-sign-in';
import { isSyncError } from '../errors';

jest.mock('./redirect-rule-sign-in', () => ({
  signInWithRedirectRule: jest.fn(),
}));
jest.mock('./identity-sign-in', () => ({
  ...jest.requireActual('./identity-sign-in'),
  signInWithIdentityAPI: jest.fn(),
}));

const WEB_CLIENT_ID =
  '662998053209-s49tq55ic3td87m08gi8vpjqm5t7r9st.apps.googleusercontent.com';

const CACHE_KEY = 'google-drive-access-token';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

type FlowResult = { url?: string; lastError?: { message: string } };

let store: Record<string, unknown>;
let flows: Array<FlowResult>;
let launchWebAuthFlow: jest.Mock;

const mockChrome = ({
  extensionURL = 'chrome-extension://abc/',
}: { extensionURL?: string } = {}) => {
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
      getURL: (path: string) => `${extensionURL}${path}`,
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
  jest.mocked(signInWithRedirectRule).mockReset();
  jest.mocked(signInWithIdentityAPI).mockReset();
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
    expect(signInWithRedirectRule).not.toBeCalled();

    const cached = store[CACHE_KEY] as { token: string; expiresAt: number };
    expect(cached.token).toBe('fresh');
    // 1800s minus the 60s skew.
    expect(cached.expiresAt).toBeGreaterThanOrEqual(before + 1740_000 - 1000);
    expect(cached.expiresAt).toBeLessThanOrEqual(Date.now() + 1740_000);
  });

  it('signs in with the Desktop client when an interactive run has no refresh token', async () => {
    jest
      .mocked(signInWithRedirectRule)
      .mockResolvedValue({ token: 'signed-in', expiresIn: 3600 });
    mockGoogle({ aud: DESKTOP_CLIENT_ID });

    await expect(getAccessToken()).resolves.toBe('signed-in');

    expect(signInWithRedirectRule).toBeCalledTimes(1);
    expect(launchWebAuthFlow).not.toBeCalled();
    expect((store[CACHE_KEY] as { token: string }).token).toBe('signed-in');
  });

  it('signs in through the auth window on Firefox', async () => {
    mockChrome({ extensionURL: 'moz-extension://abc/' });
    jest
      .mocked(signInWithIdentityAPI)
      .mockResolvedValue({ token: 'signed-in', expiresIn: 3600 });
    mockGoogle({ aud: DESKTOP_CLIENT_ID });

    await expect(getAccessToken()).resolves.toBe('signed-in');

    expect(signInWithIdentityAPI).toBeCalledTimes(1);
    expect(signInWithRedirectRule).not.toBeCalled();
  });

  it('falls back to the web client silently when a scheduled run has no refresh token', async () => {
    flows = [{ url: redirectWith('silent') }];
    mockGoogle({});

    await expect(getAccessToken({ interactive: false })).resolves.toBe(
      'silent'
    );

    expect(launchWebAuthFlow).toBeCalledTimes(1);
    expect(interactiveFlows()).toHaveLength(0);
    expect(signInWithRedirectRule).not.toBeCalled();
  });

  it('asks for a sign-in without opening anything when the fallback needs the user', async () => {
    flows = [{ lastError: { message: 'User interaction required.' } }];

    const error = await getAccessToken({ interactive: false }).catch(e => e);

    expect(error).toBeInstanceOf(Error);
    expect(isSyncError(error)).toBe(true);
    expect(error.code).toBe('sign-in');
    expect(error.message).toBe('User interaction required.');
    expect(interactiveFlows()).toHaveLength(0);
    expect(signInWithRedirectRule).not.toBeCalled();
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

describe('getIdentityAccessToken', () => {
  const IDENTITY_CACHE_KEY = 'google-identity-access-token';
  const IDENTITY_REFRESH_TOKEN_KEY = 'google-identity-refresh-token';
  const IDENTITY_SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  it('refreshes from its own refresh token, leaving Drive sign-in alone', async () => {
    store[REFRESH_TOKEN_KEY] = 'drive-refresh';
    store[CACHE_KEY] = { token: 'drive', expiresAt: Date.now() + 60_000 };
    store[IDENTITY_REFRESH_TOKEN_KEY] = 'identity-refresh';
    fetchMock.mockResponse(async request =>
      request.url === TOKEN_URL
        ? JSON.stringify({ access_token: 'identity', expires_in: 3600 })
        : JSON.stringify({ aud: DESKTOP_CLIENT_ID })
    );

    await expect(getIdentityAccessToken()).resolves.toBe('identity');

    const refresh = new URLSearchParams(
      fetchMock.mock.calls[0][1]?.body as string
    );
    expect(refresh.get('refresh_token')).toBe('identity-refresh');
    expect((store[IDENTITY_CACHE_KEY] as { token: string }).token).toBe(
      'identity'
    );
    expect((store[CACHE_KEY] as { token: string }).token).toBe('drive');
  });

  it('signs in asking only for openid and profile, keeping its refresh token apart', async () => {
    jest
      .mocked(signInWithRedirectRule)
      .mockResolvedValue({ token: 'signed-in', expiresIn: 3600 });
    mockGoogle({ aud: DESKTOP_CLIENT_ID });

    await expect(getIdentityAccessToken()).resolves.toBe('signed-in');
    expect(signInWithRedirectRule).toBeCalledWith(
      IDENTITY_SCOPES,
      IDENTITY_REFRESH_TOKEN_KEY
    );
  });

  it('signs in through the auth window on Firefox', async () => {
    mockChrome({ extensionURL: 'moz-extension://abc/' });
    jest
      .mocked(signInWithIdentityAPI)
      .mockResolvedValue({ token: 'signed-in', expiresIn: 3600 });
    mockGoogle({ aud: DESKTOP_CLIENT_ID });

    await expect(getIdentityAccessToken()).resolves.toBe('signed-in');
    expect(signInWithIdentityAPI).toBeCalledWith(
      IDENTITY_SCOPES,
      IDENTITY_REFRESH_TOKEN_KEY
    );
  });
});

describe('clearCachedToken', () => {
  it('removes the cached token so the next call re-authorizes', async () => {
    store[CACHE_KEY] = { token: 'cached', expiresAt: Date.now() + 60_000 };

    await clearCachedToken();

    expect(store[CACHE_KEY]).toBeUndefined();
  });
});
