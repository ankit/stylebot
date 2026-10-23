import fetchMock from 'jest-fetch-mock';

import {
  createSession,
  getMyStyles,
  publishStyle,
  publishVersion,
  setUsername,
  checkUsername,
  editStyle,
  unpublishStyle,
} from './api';
import { GALLERY_API_URL } from './config';
import { isGalleryApiError } from './request';
import { publishedStyle, session, style } from './gallery.fixtures';

const form = {
  name: 'Tokyo Night',
  description: '',
  css: 'body { color: red; }',
  screenshot: new Blob(['png'], { type: 'image/png' }),
};

const lastRequest = () => {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url, init: init as RequestInit };
};

const expectRejection = async (
  promise: Promise<unknown>,
  status: number,
  message?: string
) => {
  const error = await promise.catch(e => e);

  if (!isGalleryApiError(error)) {
    throw new Error('Expected a gallery API error');
  }

  expect(error.status).toBe(status);

  if (message) {
    expect(error.message).toBe(message);
  }
};

beforeEach(() => {
  fetchMock.resetMocks();
});

describe('gallery API', () => {
  it('trades a Google token for a session', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(session));

    expect(await createSession('ya29.token')).toEqual(session);

    const { url, init } = lastRequest();
    expect(url).toBe(`${GALLERY_API_URL}/session`);
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('Content-Type')).toBe(
      'application/json'
    );
    expect(JSON.parse(init.body as string)).toEqual({
      googleToken: 'ya29.token',
    });
  });

  it('sends the session as a bearer token', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ styles: [style] }));

    expect(await getMyStyles('abc')).toEqual([style]);

    const { url, init } = lastRequest();
    expect(url).toBe(`${GALLERY_API_URL}/me/styles`);
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer abc');
  });

  it('sets the username on the account', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ id: 'a', username: 'maya', usernameConfirmed: true })
    );

    await setUsername('abc', 'maya');

    const { url, init } = lastRequest();
    expect(url).toBe(`${GALLERY_API_URL}/me`);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ username: 'maya' });
  });

  it('checks a username, escaping it into the path', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        available: false,
        reason: 'taken',
        suggestion: 'maya-2',
      })
    );

    expect(await checkUsername('abc', 'maya/x')).toEqual({
      available: false,
      reason: 'taken',
      suggestion: 'maya-2',
    });
    expect(lastRequest().url).toBe(`${GALLERY_API_URL}/usernames/maya%2Fx`);
  });

  it('publishes a style as a multipart form with its site', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(publishedStyle), { status: 201 });

    expect(await publishStyle('abc', 'github.com', form)).toEqual(
      publishedStyle
    );

    const { url, init } = lastRequest();
    const body = init.body as FormData;

    expect(url).toBe(`${GALLERY_API_URL}/styles`);
    expect(body.get('site')).toBe('github.com');
    expect(body.get('name')).toBe('Tokyo Night');
    expect(body.get('css')).toBe('body { color: red; }');
    expect(body.has('description')).toBe(false);
    expect(body.get('screenshot')).toBeInstanceOf(Blob);
  });

  it('publishes a new version without a site', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(publishedStyle));

    await publishVersion('abc', 42, {
      ...form,
      description: 'Dark',
      notes: 'Darker links',
    });

    const { url, init } = lastRequest();
    const body = init.body as FormData;

    expect(url).toBe(`${GALLERY_API_URL}/styles/42/versions`);
    expect(body.has('site')).toBe(false);
    expect(body.get('description')).toBe('Dark');
    expect(body.get('notes')).toBe('Darker links');
  });

  it('edits only the details, sending an empty description to clear it', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(publishedStyle));

    await editStyle('abc', 42, { name: 'Tokyo Night', description: '' });

    const { url, init } = lastRequest();
    const body = init.body as FormData;

    expect(url).toBe(`${GALLERY_API_URL}/styles/42`);
    expect(init.method).toBe('PATCH');
    expect(body.get('description')).toBe('');
    expect(body.has('css')).toBe(false);
    expect(body.has('screenshot')).toBe(false);
  });

  it('resolves an unpublish that returns no content', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    await expect(unpublishStyle('abc', 42)).resolves.toBeUndefined();

    const { url, init } = lastRequest();

    expect(url).toBe(`${GALLERY_API_URL}/styles/42/unpublish`);
    expect(init.method).toBe('POST');
  });

  it("rejects with the server's message and status", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: 'The name is over 60 characters.' }),
      { status: 400 }
    );

    await expectRejection(
      publishStyle('abc', 'github.com', form),
      400,
      'The name is over 60 characters.'
    );
  });

  it("rejects with the server's code where it sends one", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: 'Nothing changed.', code: 'css_unchanged' }),
      { status: 422 }
    );

    const error = await publishVersion('abc', 42, form).catch(e => e);

    expect(error).toMatchObject({ status: 422, code: 'css_unchanged' });
  });

  it('rejects with the status when the body is not JSON', async () => {
    fetchMock.mockResponseOnce('Bad gateway', { status: 502 });

    await expectRejection(getMyStyles('abc'), 502);
  });

  it('rejects with status 0 when the request never gets an answer', async () => {
    fetchMock.mockRejectOnce(new TypeError('Failed to fetch'));

    await expectRejection(getMyStyles('abc'), 0, 'Failed to fetch');
  });
});
