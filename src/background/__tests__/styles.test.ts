import 'jest-fetch-mock';

import { getGoogleWebFontExists } from '../styles';

const fontUrl = 'https://fonts.googleapis.com/css2?family=Muli&display=swap';

describe('getGoogleWebFontExists', () => {
  it('is true when the google web font API serves the family', async () => {
    fetchMock.mockResponse(() => Promise.resolve({ status: 200 }));

    await expect(getGoogleWebFontExists(fontUrl)).resolves.toBe(true);
  });

  it('is false when the google web font API returns 400', async () => {
    fetchMock.mockResponse(() => Promise.resolve({ status: 400 }));

    await expect(getGoogleWebFontExists(fontUrl)).resolves.toBe(false);
  });

  it('is false when the request fails', async () => {
    fetchMock.mockResponse(() => Promise.reject(new Error('offline')));

    await expect(getGoogleWebFontExists(fontUrl)).resolves.toBe(false);
  });
});
