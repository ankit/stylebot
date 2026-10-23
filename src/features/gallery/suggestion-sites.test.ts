import fetchMock from 'jest-fetch-mock';

import { GALLERY_API_URL } from './config';
import { mockStorage } from './gallery.fixtures';
import { getSuggestionSites } from './suggestion-sites';

const DAY = 24 * 60 * 60 * 1000;

const sitesResponse = JSON.stringify({
  hosts: ['de.wikipedia.org', 'en.wikipedia.org', 'github.com'],
});

beforeEach(() => {
  fetchMock.resetMocks();
});

describe('getSuggestionSites', () => {
  it('fetches the hosts with styles and keeps them for a day', async () => {
    mockStorage();
    fetchMock.mockResponseOnce(sitesResponse);

    const sites = await getSuggestionSites(0);

    expect(fetchMock.mock.calls[0][0]).toBe(`${GALLERY_API_URL}/sites/hosts`);
    expect([...sites]).toEqual([
      'de.wikipedia.org',
      'en.wikipedia.org',
      'github.com',
    ]);

    await getSuggestionSites(DAY - 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetches again once the list is a day old', async () => {
    mockStorage({
      'gallery-suggestion-sites': { sites: ['old.example'], fetchedAt: 0 },
    });
    fetchMock.mockResponseOnce(sitesResponse);

    const sites = await getSuggestionSites(DAY);

    expect(sites.has('github.com')).toBe(true);
    expect(sites.has('old.example')).toBe(false);
  });

  it("keeps the old list while the gallery can't be reached", async () => {
    mockStorage({
      'gallery-suggestion-sites': { sites: ['github.com'], fetchedAt: 0 },
    });
    fetchMock.mockRejectOnce(new Error('offline'));

    const sites = await getSuggestionSites(DAY);

    expect([...sites]).toEqual(['github.com']);
  });
});
