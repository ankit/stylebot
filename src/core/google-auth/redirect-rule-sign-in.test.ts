import fetchMock from 'jest-fetch-mock';

import { getGoogleToken, getStoredGoogleToken } from './token';
import { DESKTOP_CLIENT_ID } from './desktop-client';
import {
  CLOSE_GRACE_MS,
  handleSignInRedirect,
  isSignInRedirect,
} from './redirect-rule-sign-in';

const CACHE_KEY = 'drive-access-token';
const REFRESH_TOKEN_KEY = 'drive-refresh-token';
const DRIVE = {
  scopes: ['https://www.googleapis.com/auth/drive.file'],
  cacheKey: CACHE_KEY,
  refreshTokenKey: REFRESH_TOKEN_KEY,
};
const IDENTITY = {
  scopes: ['openid', 'https://www.googleapis.com/auth/userinfo.profile'],
  cacheKey: 'identity-access-token',
  refreshTokenKey: 'identity-refresh-token',
};
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const EXTENSION_PAGE = 'safari-web-extension://abc/google-sign-in/index.html';

type ChangeListener = (
  changes: Record<string, { newValue?: unknown }>,
  area: string
) => void;

let store: Record<string, unknown>;
let changeListeners: Array<ChangeListener>;
let removedListeners: Array<(tabId: number) => Promise<void>>;
let openTabs: Set<number>;
let tokenRequests: Array<URLSearchParams>;
let tokenResponses: Array<Record<string, unknown>>;

const mockChrome = () => {
  global.chrome = {
    runtime: {
      getURL: (path: string) => `safari-web-extension://abc/${path}`,
    },
    tabs: {
      query: jest.fn().mockResolvedValue([{ id: 1 }]),
      get: jest.fn(async (tabId: number) => {
        if (!openTabs.has(tabId)) {
          throw new Error('No tab');
        }
        return { id: tabId };
      }),
      create: jest.fn(async () => {
        const id = 7 + jest.mocked(chrome.tabs.create).mock.calls.length - 1;
        openTabs.add(id);
        return { id };
      }),
      remove: jest.fn(async (tabId: number) => {
        openTabs.delete(tabId);
      }),
      update: jest.fn(),
      onRemoved: {
        addListener: (listener: (tabId: number) => Promise<void>) =>
          removedListeners.push(listener),
        removeListener: (listener: (tabId: number) => Promise<void>) => {
          removedListeners = removedListeners.filter(l => l !== listener);
        },
      },
    },
    declarativeNetRequest: {
      updateDynamicRules: jest.fn().mockResolvedValue(undefined),
    },
    storage: {
      onChanged: {
        addListener: (listener: ChangeListener) =>
          changeListeners.push(listener),
        removeListener: (listener: ChangeListener) => {
          changeListeners = changeListeners.filter(l => l !== listener);
        },
      },
      local: {
        get: jest.fn(async (key: string) => ({ [key]: store[key] })),
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
          const changes = Object.fromEntries(
            Object.entries(items).map(([key, newValue]) => [key, { newValue }])
          );
          [...changeListeners].forEach(listener => listener(changes, 'local'));
        }),
        remove: jest.fn(async (key: string) => {
          delete store[key];
        }),
      },
    },
  } as unknown as typeof chrome;
};

const mockGoogle = () =>
  fetchMock.mockResponse(async request => {
    if (request.url === TOKEN_URL) {
      tokenRequests.push(new URLSearchParams(await request.text()));
      return JSON.stringify(tokenResponses.shift() ?? {});
    }

    return JSON.stringify({ aud: DESKTOP_CLIENT_ID });
  });

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Waits for the sign-in tab to open and its pending sign-in to be stored.
 */
const signInTabOpened = async (): Promise<void> => {
  for (let i = 0; i < 50 && !changeListeners.length; i++) {
    await settle();
  }
};

const openedAuthURL = (): URL =>
  new URL(jest.mocked(chrome.tabs.create).mock.calls[0][0].url as string);

const redirectFor = (state: string | null, code = 'c-1'): string =>
  `${EXTENSION_PAGE}?code=${code}&state=${state}`;

const base64Url = (bytes: ArrayBuffer): string =>
  Buffer.from(bytes).toString('base64url');

beforeEach(() => {
  store = {};
  changeListeners = [];
  removedListeners = [];
  openTabs = new Set([1]);
  tokenRequests = [];
  tokenResponses = [];
  fetchMock.resetMocks();
  mockChrome();
  mockGoogle();
});

describe('Google sign-in without an identity API', () => {
  it('refreshes silently with a stored refresh token, opening no tab', async () => {
    store[REFRESH_TOKEN_KEY] = 'refresh-1';
    tokenResponses = [{ access_token: 'fresh', expires_in: 3600 }];

    await expect(getStoredGoogleToken(DRIVE)).resolves.toBe('fresh');

    expect(tokenRequests[0].get('grant_type')).toBe('refresh_token');
    expect(tokenRequests[0].get('refresh_token')).toBe('refresh-1');
    expect(chrome.tabs.create).not.toBeCalled();
    expect((store[CACHE_KEY] as { token: string }).token).toBe('fresh');
  });

  it('resolves no stored token rather than opening a tab', async () => {
    await expect(getStoredGoogleToken(DRIVE)).resolves.toBeNull();

    expect(chrome.tabs.create).not.toBeCalled();
  });

  it('keeps the refresh token and reports a network error while Google is down', async () => {
    store[REFRESH_TOKEN_KEY] = 'refresh-1';
    fetchMock.mockResponseOnce('{}', { status: 503 });

    await expect(getStoredGoogleToken(DRIVE)).rejects.toMatchObject({
      code: 'network',
    });

    expect(store[REFRESH_TOKEN_KEY]).toBe('refresh-1');
  });

  it('forgets a refresh token Google no longer honours', async () => {
    store[REFRESH_TOKEN_KEY] = 'revoked';
    tokenResponses = [{ error: 'invalid_grant' }];

    await expect(getStoredGoogleToken(DRIVE)).resolves.toBeNull();

    expect(store[REFRESH_TOKEN_KEY]).toBeUndefined();
  });

  it('signs in through a tab with PKCE and keeps the refresh token', async () => {
    tokenResponses = [
      { access_token: 'first', expires_in: 3600, refresh_token: 'r-2' },
      { access_token: 'signed-in', expires_in: 3600 },
    ];

    const result = getGoogleToken(DRIVE);
    await signInTabOpened();
    const auth = openedAuthURL();

    expect(auth.searchParams.get('client_id')).toBe(DESKTOP_CLIENT_ID);
    expect(auth.searchParams.get('access_type')).toBe('offline');

    await expect(
      handleSignInRedirect(redirectFor(auth.searchParams.get('state')))
    ).resolves.toBe(true);
    await expect(result).resolves.toBe('signed-in');

    const exchange = tokenRequests[0];
    const challenge = base64Url(
      await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(exchange.get('code_verifier') as string)
      )
    );

    expect(exchange.get('code')).toBe('c-1');
    expect(auth.searchParams.get('code_challenge')).toBe(challenge);
    expect(store[REFRESH_TOKEN_KEY]).toBe('r-2');
    expect(chrome.tabs.remove).toBeCalledWith(7);
    expect(chrome.tabs.update).toBeCalledWith(1, { active: true });
    expect(
      chrome.declarativeNetRequest.updateDynamicRules
    ).toHaveBeenLastCalledWith({ removeRuleIds: [1] });
  });

  it('finishes a sign-in whose opener went away with the background', async () => {
    tokenResponses = [{ access_token: 'a', refresh_token: 'r-3' }];

    getGoogleToken(DRIVE).catch(() => undefined);
    await signInTabOpened();
    const state = openedAuthURL().searchParams.get('state');

    // A reloaded background has none of the first one's listeners.
    changeListeners = [];
    removedListeners = [];

    await expect(handleSignInRedirect(redirectFor(state))).resolves.toBe(true);
    expect(store[REFRESH_TOKEN_KEY]).toBe('r-3');
    expect(chrome.tabs.remove).toBeCalledWith(7);
  });

  it('finishes a sign-in from the loopback address the redirect rule missed', async () => {
    tokenResponses = [{ access_token: 'a', refresh_token: 'r-4' }];

    getGoogleToken(DRIVE).catch(() => undefined);
    await signInTabOpened();
    const state = openedAuthURL().searchParams.get('state');
    const loopback = `http://127.0.0.1/stylebot-auth?code=c-1&state=${state}`;

    expect(isSignInRedirect(loopback)).toBe(true);
    expect(isSignInRedirect(redirectFor(state))).toBe(false);

    await expect(handleSignInRedirect(loopback, 9)).resolves.toBe(true);
    expect(store[REFRESH_TOKEN_KEY]).toBe('r-4');
    expect(chrome.tabs.remove).toBeCalledWith(9);
  });

  it("keeps the refresh token of a sign-in started before each kept its key as Drive's", async () => {
    tokenResponses = [{ access_token: 'a', refresh_token: 'r-5' }];
    store['google-drive-sign-in'] = [
      { state: 'older', verifier: 'v', tabId: 5, status: 'pending' },
    ];

    await expect(handleSignInRedirect(redirectFor('older'))).resolves.toBe(
      true
    );
    expect(store['google-drive-refresh-token']).toBe('r-5');
  });

  it('brings back the open sign-in tab instead of opening another', async () => {
    getGoogleToken(DRIVE).catch(() => undefined);
    await signInTabOpened();

    getGoogleToken(DRIVE).catch(() => undefined);
    for (let i = 0; i < 10; i++) {
      await settle();
    }

    expect(chrome.tabs.create).toHaveBeenCalledTimes(1);
    expect(chrome.tabs.update).toBeCalledWith(7, { active: true });
  });

  it('keeps sign-ins with their own refresh tokens apart', async () => {
    tokenResponses = [
      { access_token: 'a', refresh_token: 'identity-refresh' },
      { access_token: 'identity', expires_in: 3600 },
    ];

    getGoogleToken(DRIVE).catch(() => undefined);
    await signInTabOpened();
    const identity = getGoogleToken(IDENTITY);
    for (let i = 0; i < 10; i++) {
      await settle();
    }

    expect(chrome.tabs.create).toHaveBeenCalledTimes(2);
    const auth = new URL(
      jest.mocked(chrome.tabs.create).mock.calls[1][0].url as string
    );
    expect(auth.searchParams.get('scope')).toBe(
      'openid https://www.googleapis.com/auth/userinfo.profile'
    );

    await expect(
      handleSignInRedirect(redirectFor(auth.searchParams.get('state')))
    ).resolves.toBe(true);
    await expect(identity).resolves.toBe('identity');

    expect(store[IDENTITY.refreshTokenKey]).toBe('identity-refresh');
    expect(store[REFRESH_TOKEN_KEY]).toBeUndefined();
    expect(chrome.tabs.remove).toBeCalledWith(8);
    expect(chrome.tabs.remove).not.toBeCalledWith(7);
    expect(chrome.declarativeNetRequest.updateDynamicRules).not.toBeCalledWith({
      removeRuleIds: [1],
    });
  });

  it('ignores a redirect whose state does not match the sign-in it started', async () => {
    getGoogleToken(DRIVE).catch(() => undefined);
    await signInTabOpened();

    await expect(handleSignInRedirect(redirectFor('forged'))).resolves.toBe(
      false
    );
    expect(tokenRequests).toHaveLength(0);
  });

  it('fails the sign-in when Google sends back no code', async () => {
    const result = getGoogleToken(DRIVE);
    await signInTabOpened();
    const state = openedAuthURL().searchParams.get('state');

    await handleSignInRedirect(
      `${EXTENSION_PAGE}?error=access_denied&state=${state}`
    );

    await expect(result).rejects.toMatchObject({ code: 'sign-in' });
    expect(chrome.tabs.remove).toBeCalledWith(7);
  });

  it("fails the sign-in with Google's reason when it won't trade the code", async () => {
    tokenResponses = [
      { error: 'invalid_client', error_description: 'Unauthorized' },
    ];
    const result = getGoogleToken(DRIVE);
    await signInTabOpened();
    const state = openedAuthURL().searchParams.get('state');

    await handleSignInRedirect(redirectFor(state));

    await expect(result).rejects.toMatchObject({
      code: 'sign-in',
      message: 'Authorization failure: invalid_client: Unauthorized',
    });
  });

  it('keeps waiting when Safari swaps the tab id on the way back', async () => {
    tokenResponses = [
      { access_token: 'first', refresh_token: 'r-4' },
      { access_token: 'signed-in' },
    ];

    const result = getGoogleToken(DRIVE);
    await signInTabOpened();
    const state = openedAuthURL().searchParams.get('state');

    // Safari reports the tab removed as it moves to the extension page.
    jest.useFakeTimers();
    removedListeners.forEach(listener => listener(7));
    await handleSignInRedirect(redirectFor(state), 9);
    await jest.advanceTimersByTimeAsync(CLOSE_GRACE_MS);
    jest.useRealTimers();

    await expect(result).resolves.toBe('signed-in');
    expect(chrome.tabs.remove).toBeCalledWith(9);
  });

  it('rejects when the user closes the sign-in tab', async () => {
    const result = getGoogleToken(DRIVE).catch(e => e);
    await signInTabOpened();

    jest.useFakeTimers();
    const closed = Promise.all(removedListeners.map(listener => listener(7)));
    await jest.advanceTimersByTimeAsync(CLOSE_GRACE_MS);
    await closed;
    jest.useRealTimers();

    expect(await result).toMatchObject({ code: 'sign-in' });
    expect(
      chrome.declarativeNetRequest.updateDynamicRules
    ).toHaveBeenLastCalledWith({ removeRuleIds: [1] });
  });
});
