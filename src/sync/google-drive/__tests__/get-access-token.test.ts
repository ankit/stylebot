import fetchMock from 'jest-fetch-mock';

import getAccessToken, { clearCachedToken } from '../get-access-token';
import { isSyncError } from '../../errors';

const CLIENT_ID =
  '662998053209-s49tq55ic3td87m08gi8vpjqm5t7r9st.apps.googleusercontent.com';

const CACHE_KEY = 'google-drive-access-token';

type FlowResult = { url?: string; lastError?: { message: string } };

let store: Record<string, unknown>;
let flows: FlowResult[];
let launchWebAuthFlow: jest.Mock;

const mockChrome = () => {
  launchWebAuthFlow = jest.fn(
    (
      _options: { interactive: boolean; url: string },
      callback: (responseURL?: string) => void
    ) => {
      const next = flows.shift() ?? { lastError: { message: 'no flow queued' } };
      (global.chrome.runtime as { lastError?: unknown }).lastError =
        next.lastError;
      callback(next.url);
      (global.chrome.runtime as { lastError?: unknown }).lastError = undefined;
    }
  );

  global.chrome = {
    runtime: { lastError: undefined },
    identity: {
      getRedirectURL: () => 'https://abc.chromiumapp.org/',
      launchWebAuthFlow,
    },
    storage: {
      local: {
        get: jest.fn((key: string, callback: (items: unknown) => void) => {
          callback({ [key]: store[key] });
        }),
        set: jest.fn(
          (items: Record<string, unknown>, callback?: () => void) => {
            Object.assign(store, items);
            callback?.();
          }
        ),
        remove: jest.fn((key: string, callback?: () => void) => {
          delete store[key];
          callback?.();
        }),
      },
    },
  } as unknown as typeof chrome;
};

const redirectWith = (token: string, expiresIn = 3600) =>
  `https://abc.chromiumapp.org/#access_token=${token}&expires_in=${expiresIn}&token_type=Bearer`;

const mockValidTokenInfo = () =>
  fetchMock.mockResponse(JSON.stringify({ aud: CLIENT_ID }));

const interactiveCalls = () =>
  launchWebAuthFlow.mock.calls.filter(([options]) => options.interactive);

const silentCalls = () =>
  launchWebAuthFlow.mock.calls.filter(([options]) => !options.interactive);

beforeEach(() => {
  store = {};
  flows = [];
  fetchMock.resetMocks();
  mockChrome();
});

describe('getAccessToken', () => {
  it('reuses a cached token without starting an auth flow', async () => {
    store[CACHE_KEY] = { token: 'cached', expiresAt: Date.now() + 60_000 };

    await expect(getAccessToken()).resolves.toBe('cached');
    expect(launchWebAuthFlow).not.toBeCalled();
    expect(fetchMock).not.toBeCalled();
  });

  it('ignores an expired cached token and authorizes again', async () => {
    store[CACHE_KEY] = { token: 'stale', expiresAt: Date.now() - 1 };
    flows = [{ url: redirectWith('fresh') }];
    mockValidTokenInfo();

    await expect(getAccessToken()).resolves.toBe('fresh');
    expect(launchWebAuthFlow).toBeCalled();
  });

  it('tries silently first and caches the result with its expiry', async () => {
    flows = [{ url: redirectWith('silent', 1800) }];
    mockValidTokenInfo();

    const before = Date.now();
    await expect(getAccessToken()).resolves.toBe('silent');

    expect(silentCalls()).toHaveLength(1);
    expect(interactiveCalls()).toHaveLength(0);

    const cached = store[CACHE_KEY] as { token: string; expiresAt: number };
    expect(cached.token).toBe('silent');
    // 1800s minus the 60s skew.
    expect(cached.expiresAt).toBeGreaterThanOrEqual(before + 1740_000 - 1000);
    expect(cached.expiresAt).toBeLessThanOrEqual(Date.now() + 1740_000);
  });

  it('escalates to an interactive flow exactly once when the silent one fails', async () => {
    flows = [
      { lastError: { message: 'User interaction required.' } },
      { url: redirectWith('interactive') },
    ];
    mockValidTokenInfo();

    await expect(getAccessToken()).resolves.toBe('interactive');
    expect(silentCalls()).toHaveLength(1);
    expect(interactiveCalls()).toHaveLength(1);
  });

  it('does not raise an auth window when interactive is disallowed', async () => {
    flows = [{ lastError: { message: 'User interaction required.' } }];

    await expect(
      getAccessToken({ interactive: false })
    ).rejects.toMatchObject({ code: 'auth' });

    expect(interactiveCalls()).toHaveLength(0);
  });

  it('rejects with a real Error carrying an auth code when the user cancels', async () => {
    flows = [
      { lastError: { message: 'The user did not approve access.' } },
      { lastError: { message: 'The user did not approve access.' } },
    ];

    const error = await getAccessToken().catch(e => e);

    expect(error).toBeInstanceOf(Error);
    expect(isSyncError(error)).toBe(true);
    expect(error.code).toBe('auth');
    expect(error.message).toBe('The user did not approve access.');
  });

  it('rejects when the redirect carries no access token', async () => {
    flows = [
      { url: 'https://abc.chromiumapp.org/#error=access_denied' },
      { url: 'https://abc.chromiumapp.org/#error=access_denied' },
    ];

    await expect(getAccessToken()).rejects.toMatchObject({ code: 'auth' });
  });

  it('rejects and does not cache when the token fails validation', async () => {
    flows = [{ url: redirectWith('wrong') }, { url: redirectWith('wrong') }];
    fetchMock.mockResponse(JSON.stringify({ aud: 'someone-else' }));

    await expect(getAccessToken()).rejects.toMatchObject({ code: 'auth' });
    expect(store[CACHE_KEY]).toBeUndefined();
  });

  it('rejects when the tokeninfo endpoint itself fails', async () => {
    flows = [{ url: redirectWith('token') }, { url: redirectWith('token') }];
    fetchMock.mockResponse('{}', { status: 500 });

    await expect(getAccessToken()).rejects.toMatchObject({ code: 'auth' });
  });
});

describe('clearCachedToken', () => {
  it('removes the cached token so the next call re-authorizes', async () => {
    store[CACHE_KEY] = { token: 'cached', expiresAt: Date.now() + 60_000 };

    await clearCachedToken();

    expect(store[CACHE_KEY]).toBeUndefined();
  });
});
