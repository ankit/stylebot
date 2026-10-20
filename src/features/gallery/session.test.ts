import fetchMock from 'jest-fetch-mock';
import {
  clearGoogleToken,
  getGoogleToken,
  signOutOfGoogle,
} from '@stylebot/google-auth';

import { galleryApiError } from './request';
import { account, mockStorage, session } from './gallery.fixtures';
import {
  getSignedInAccount,
  getStoredSession,
  signIn,
  signOut,
  storeAccount,
  withSession,
} from './session';

jest.mock('@stylebot/google-auth', () => ({
  getGoogleToken: jest.fn(),
  clearGoogleToken: jest.fn(),
  signOutOfGoogle: jest.fn(),
}));

const SESSION_KEY = 'gallery-session';

beforeEach(() => {
  fetchMock.resetMocks();
  jest.mocked(getGoogleToken).mockReset().mockResolvedValue('ya29.token');
  jest.mocked(clearGoogleToken).mockReset().mockResolvedValue(undefined);
  jest.mocked(signOutOfGoogle).mockReset().mockResolvedValue(undefined);
});

describe('gallery session', () => {
  it('stores the session it signs in with', async () => {
    const store = mockStorage();
    fetchMock.mockResponseOnce(JSON.stringify(session));

    await signIn();

    expect(store[SESSION_KEY]).toEqual(session);
    expect(await getSignedInAccount()).toEqual(account);
    expect(getGoogleToken).toBeCalledWith({
      scopes: ['openid', 'https://www.googleapis.com/auth/userinfo.profile'],
      cacheKey: 'google-identity-access-token',
      refreshTokenKey: 'google-identity-refresh-token',
    });
  });

  it('signs in with a fresh Google token when the cached one is refused', async () => {
    mockStorage();
    jest
      .mocked(getGoogleToken)
      .mockResolvedValueOnce('ya29.revoked')
      .mockResolvedValueOnce('ya29.fresh');
    fetchMock
      .mockResponseOnce(JSON.stringify({ error: 'Google said no' }), {
        status: 401,
      })
      .mockResponseOnce(JSON.stringify(session));

    await signIn();

    expect(clearGoogleToken).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toEqual({
      googleToken: 'ya29.fresh',
    });
  });

  it('forgets the session and its Google tokens on sign-out', async () => {
    const store = mockStorage({ [SESSION_KEY]: session });

    await signOut();

    expect(store[SESSION_KEY]).toBeUndefined();
    expect(await getSignedInAccount()).toBeNull();
    expect(signOutOfGoogle).toBeCalledWith({
      scopes: ['openid', 'https://www.googleapis.com/auth/userinfo.profile'],
      cacheKey: 'google-identity-access-token',
      refreshTokenKey: 'google-identity-refresh-token',
    });
  });

  it('treats a session about to expire as signed out', async () => {
    mockStorage({
      [SESSION_KEY]: { ...session, expiresAt: Date.now() + 60 * 1000 },
    });

    expect(await getSignedInAccount()).toBeNull();
  });

  it('runs with the stored session without signing in', async () => {
    mockStorage({ [SESSION_KEY]: session });
    const run = jest.fn(async (value: string) => value);

    expect(await withSession(run)).toBe(session.session);
    expect(jest.mocked(getGoogleToken)).not.toHaveBeenCalled();
  });

  it('signs in first when there is no session', async () => {
    mockStorage();
    fetchMock.mockResponseOnce(JSON.stringify(session));
    const run = jest.fn(async (value: string) => value);

    expect(await withSession(run)).toBe(session.session);
    expect(jest.mocked(getGoogleToken)).toHaveBeenCalledTimes(1);
  });

  it('signs in again and retries once when the session is refused', async () => {
    const store = mockStorage({
      [SESSION_KEY]: { ...session, session: 'expired' },
    });
    fetchMock.mockResponseOnce(JSON.stringify(session));
    const run = jest
      .fn()
      .mockRejectedValueOnce(galleryApiError('Session expired', 401))
      .mockResolvedValueOnce('done');

    expect(await withSession(run)).toBe('done');
    expect(run).toHaveBeenLastCalledWith(session.session);
    expect(store[SESSION_KEY]).toEqual(session);
  });

  it('passes other errors through without signing in', async () => {
    mockStorage({ [SESSION_KEY]: session });
    const run = jest
      .fn()
      .mockRejectedValue(galleryApiError('Daily limit', 429));

    await expect(withSession(run)).rejects.toMatchObject({
      status: 429,
    });
    expect(run).toHaveBeenCalledTimes(1);
    expect(jest.mocked(getGoogleToken)).not.toHaveBeenCalled();
  });

  it('updates the stored account', async () => {
    const store = mockStorage({ [SESSION_KEY]: session });

    await storeAccount({ ...account, username: 'maya-k' });

    expect(store[SESSION_KEY]).toEqual({
      ...session,
      account: { ...account, username: 'maya-k' },
    });
  });

  it('drops a stored session from before usernames', async () => {
    mockStorage({
      [SESSION_KEY]: { ...session, account: { id: account.id, name: null } },
    });

    await expect(getStoredSession()).resolves.toBeNull();
  });
});
