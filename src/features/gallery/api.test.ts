import fetchMock from 'jest-fetch-mock';

import {
  createSession,
  getMyStyles,
  publishStyle,
  publishVersion,
  setDisplayName,
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

  it('clears the display name with null when it is empty', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ id: 'a', name: null }));

    await setDisplayName('abc', '');

    const { init } = lastRequest();
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ name: null });
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

    await publishVersion('abc', 'Xk3p9QaL2m', {
      ...form,
      description: 'Dark',
      notes: 'Darker links',
    });

    const { url, init } = lastRequest();
    const body = init.body as FormData;

    expect(url).toBe(`${GALLERY_API_URL}/styles/Xk3p9QaL2m/versions`);
    expect(body.has('site')).toBe(false);
    expect(body.get('description')).toBe('Dark');
    expect(body.get('notes')).toBe('Darker links');
  });

  it('resolves an unpublish that returns no content', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    await expect(unpublishStyle('abc', 'Xk3p9QaL2m')).resolves.toBeUndefined();
    expect(lastRequest().init.method).toBe('DELETE');
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

  it('rejects with the status when the body is not JSON', async () => {
    fetchMock.mockResponseOnce('Bad gateway', { status: 502 });

    await expectRejection(getMyStyles('abc'), 502);
  });

  it('rejects with status 0 when the request never gets an answer', async () => {
    fetchMock.mockRejectOnce(new TypeError('Failed to fetch'));

    await expectRejection(getMyStyles('abc'), 0, 'Failed to fetch');
  });
});
