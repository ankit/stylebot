import fetchMock from 'jest-fetch-mock';

import {
  clearGoogleToken,
  getGoogleToken,
  getStoredGoogleToken,
} from './token';
import { DESKTOP_CLIENT_ID } from './desktop-client';
import { signInWithIdentityAPI } from './identity-sign-in';
import { signInWithRedirectRule } from './redirect-rule-sign-in';

jest.mock('./redirect-rule-sign-in', () => ({
  signInWithRedirectRule: jest.fn(),
}));
jest.mock('./identity-sign-in', () => ({
  ...jest.requireActual('./identity-sign-in'),
  signInWithIdentityAPI: jest.fn(),
}));

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

const ACCESS = {
  scopes: ['openid'],
  cacheKey: 'access-token',
  refreshTokenKey: 'refresh-token',
};
const OTHER_ACCESS = {
  scopes: ['https://www.googleapis.com/auth/drive.file'],
  cacheKey: 'other-access-token',
  refreshTokenKey: 'other-refresh-token',
};

let store: Record<string, unknown>;

const mockChrome = (extensionURL = 'chrome-extension://abc/') => {
  global.chrome = {
    runtime: { getURL: (path: string) => `${extensionURL}${path}` },
    identity: {
      getRedirectURL: () => 'https://abc.chromiumapp.org/',
      launchWebAuthFlow: jest.fn(),
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

/**
 * Answers token refreshes with `refreshed` and tokeninfo with the client the
 * token belongs to.
 */
const mockGoogle = ({
  refreshed,
  aud = DESKTOP_CLIENT_ID,
}: {
  refreshed?: Record<string, unknown>;
  aud?: string;
}) =>
  fetchMock.mockResponse(async request =>
    request.url === TOKEN_URL
      ? JSON.stringify(refreshed ?? {})
      : JSON.stringify({ aud })
  );

beforeEach(() => {
  store = {};
  fetchMock.resetMocks();
  jest.mocked(signInWithRedirectRule).mockReset();
  jest.mocked(signInWithIdentityAPI).mockReset();
  mockChrome();
});

describe('getStoredGoogleToken', () => {
  it('reuses a cached token without asking Google', async () => {
    store[ACCESS.cacheKey] = {
      token: 'cached',
      expiresAt: Date.now() + 60_000,
    };

    await expect(getStoredGoogleToken(ACCESS)).resolves.toBe('cached');
    expect(fetchMock).not.toBeCalled();
  });

  it('refreshes from its own refresh token, leaving other sign-ins alone', async () => {
    store[ACCESS.cacheKey] = { token: 'stale', expiresAt: Date.now() - 1 };
    store[ACCESS.refreshTokenKey] = 'refresh-1';
    store[OTHER_ACCESS.cacheKey] = {
      token: 'other',
      expiresAt: Date.now() + 60_000,
    };
    store[OTHER_ACCESS.refreshTokenKey] = 'other-refresh';
    mockGoogle({ refreshed: { access_token: 'fresh', expires_in: 1800 } });

    const before = Date.now();
    await expect(getStoredGoogleToken(ACCESS)).resolves.toBe('fresh');

    const refresh = new URLSearchParams(
      fetchMock.mock.calls[0][1]?.body as string
    );
    expect(refresh.get('refresh_token')).toBe('refresh-1');
    expect(signInWithRedirectRule).not.toBeCalled();

    const cached = store[ACCESS.cacheKey] as {
      token: string;
      expiresAt: number;
    };
    expect(cached.token).toBe('fresh');
    // 1800s minus the 60s skew.
    expect(cached.expiresAt).toBeGreaterThanOrEqual(before + 1740_000 - 1000);
    expect(cached.expiresAt).toBeLessThanOrEqual(Date.now() + 1740_000);
    expect((store[OTHER_ACCESS.cacheKey] as { token: string }).token).toBe(
      'other'
    );
  });

  it('resolves null when there is nothing stored', async () => {
    await expect(getStoredGoogleToken(ACCESS)).resolves.toBeNull();
    expect(signInWithRedirectRule).not.toBeCalled();
  });
});

describe('getGoogleToken', () => {
  it('signs in through a tab with its scopes and refresh token key', async () => {
    jest
      .mocked(signInWithRedirectRule)
      .mockResolvedValue({ token: 'signed-in', expiresIn: 3600 });
    mockGoogle({});

    await expect(getGoogleToken(ACCESS)).resolves.toBe('signed-in');

    expect(signInWithRedirectRule).toBeCalledWith(
      ACCESS.scopes,
      ACCESS.refreshTokenKey
    );
    expect(signInWithIdentityAPI).not.toBeCalled();
    expect((store[ACCESS.cacheKey] as { token: string }).token).toBe(
      'signed-in'
    );
  });

  it('signs in through the auth window on Firefox', async () => {
    mockChrome('moz-extension://abc/');
    jest
      .mocked(signInWithIdentityAPI)
      .mockResolvedValue({ token: 'signed-in', expiresIn: 3600 });
    mockGoogle({});

    await expect(getGoogleToken(ACCESS)).resolves.toBe('signed-in');

    expect(signInWithIdentityAPI).toBeCalledWith(
      ACCESS.scopes,
      ACCESS.refreshTokenKey
    );
    expect(signInWithRedirectRule).not.toBeCalled();
  });

  it('rejects and does not cache when the token fails validation', async () => {
    jest
      .mocked(signInWithRedirectRule)
      .mockResolvedValue({ token: 'wrong', expiresIn: 3600 });
    mockGoogle({ aud: 'someone-else' });

    await expect(getGoogleToken(ACCESS)).rejects.toMatchObject({
      code: 'sign-in',
    });
    expect(store[ACCESS.cacheKey]).toBeUndefined();
  });

  it('reports a network error when the tokeninfo endpoint is down', async () => {
    jest
      .mocked(signInWithRedirectRule)
      .mockResolvedValue({ token: 'token', expiresIn: 3600 });
    fetchMock.mockResponse('{}', { status: 500 });

    await expect(getGoogleToken(ACCESS)).rejects.toMatchObject({
      code: 'network',
    });
  });
});

describe('clearGoogleToken', () => {
  it('removes the cached token so the next call gets a new one', async () => {
    store[ACCESS.cacheKey] = {
      token: 'cached',
      expiresAt: Date.now() + 60_000,
    };

    await clearGoogleToken(ACCESS);

    expect(store[ACCESS.cacheKey]).toBeUndefined();
  });
});
