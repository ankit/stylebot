import fetchMock from 'jest-fetch-mock';

import { getStyle } from './api';
import { isGalleryApiError } from './request';

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
  it("rejects with the server's message and status", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ error: 'Not found.' }), {
      status: 404,
    });

    await expectRejection(getStyle(42), 404, 'Not found.');
  });

  it('rejects with the status when the body is not JSON', async () => {
    fetchMock.mockResponseOnce('Bad gateway', { status: 502 });

    await expectRejection(getStyle(42), 502);
  });

  it('rejects with status 0 when the request never gets an answer', async () => {
    fetchMock.mockRejectOnce(new TypeError('Failed to fetch'));

    await expectRejection(getStyle(42), 0, 'Failed to fetch');
  });
});
