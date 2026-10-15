import fetchMock from 'jest-fetch-mock';

import { galleryApiError } from './request';
import { account, mockStorage, session } from './gallery.fixtures';
import {
  getSignedInAccount,
  signIn,
  storeAccount,
  withSession,
  type GoogleTokenSource,
} from './session';

const SESSION_KEY = 'gallery-session';

let google: GoogleTokenSource & {
  getToken: jest.Mock;
  clearToken: jest.Mock;
};

beforeEach(() => {
  fetchMock.resetMocks();
  google = {
    getToken: jest.fn(async () => 'ya29.token'),
    clearToken: jest.fn(async () => undefined),
  };
});

describe('gallery session', () => {
  it('stores the session it signs in with', async () => {
    const store = mockStorage();
    fetchMock.mockResponseOnce(JSON.stringify(session));

    await signIn(google);

    expect(store[SESSION_KEY]).toEqual(session);
    expect(await getSignedInAccount()).toEqual(account);
  });

  it('signs in with a fresh Google token when the cached one is refused', async () => {
    mockStorage();
    google.getToken
      .mockResolvedValueOnce('ya29.revoked')
      .mockResolvedValueOnce('ya29.fresh');
    fetchMock
      .mockResponseOnce(JSON.stringify({ error: 'Google said no' }), {
        status: 401,
      })
      .mockResponseOnce(JSON.stringify(session));

    await signIn(google);

    expect(google.clearToken).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toEqual({
      googleToken: 'ya29.fresh',
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

    expect(await withSession(google, run)).toBe(session.session);
    expect(google.getToken).not.toHaveBeenCalled();
  });

  it('signs in first when there is no session', async () => {
    mockStorage();
    fetchMock.mockResponseOnce(JSON.stringify(session));
    const run = jest.fn(async (value: string) => value);

    expect(await withSession(google, run)).toBe(session.session);
    expect(google.getToken).toHaveBeenCalledTimes(1);
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

    expect(await withSession(google, run)).toBe('done');
    expect(run).toHaveBeenLastCalledWith(session.session);
    expect(store[SESSION_KEY]).toEqual(session);
  });

  it('passes other errors through without signing in', async () => {
    mockStorage({ [SESSION_KEY]: session });
    const run = jest
      .fn()
      .mockRejectedValue(galleryApiError('Daily limit', 429));

    await expect(withSession(google, run)).rejects.toMatchObject({
      status: 429,
    });
    expect(run).toHaveBeenCalledTimes(1);
    expect(google.getToken).not.toHaveBeenCalled();
  });

  it('updates the stored account', async () => {
    const store = mockStorage({ [SESSION_KEY]: session });

    await storeAccount({ ...account, name: 'Maya' });

    expect(store[SESSION_KEY]).toEqual({
      ...session,
      account: { ...account, name: 'Maya' },
    });
  });
});
