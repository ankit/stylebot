import fetchMock from 'jest-fetch-mock';

import { style as galleryStyle, mockStorage } from './gallery.fixtures';
import { getSiteSuggestions } from './site-suggestions';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const page = (names: Array<string>) =>
  JSON.stringify({
    styles: names.map((name, id) => ({ ...galleryStyle, id, name })),
    nextOffset: null,
  });

const names = (styles: Array<{ name: string }>) =>
  styles.map(style => style.name);

beforeEach(() => {
  fetchMock.resetMocks();
});

describe('getSiteSuggestions', () => {
  it("fetches a site's styles once, then answers from storage", async () => {
    mockStorage();
    fetchMock.mockResponseOnce(page(['Tokyo Night']));

    expect(names(await getSiteSuggestions('github.com', 12, 0))).toEqual([
      'Tokyo Night',
    ]);
    expect(names(await getSiteSuggestions('github.com', 12, HOUR - 1))).toEqual(
      ['Tokyo Night']
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('answers with stale styles and fetches them again for next time', async () => {
    const store = mockStorage();
    fetchMock.mockResponseOnce(page(['Old']));
    await getSiteSuggestions('github.com', 12, 0);

    fetchMock.mockResponseOnce(page(['New']));

    expect(names(await getSiteSuggestions('github.com', 12, HOUR))).toEqual([
      'Old',
    ]);
    await new Promise(resolve => setTimeout(resolve));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const stored = store['gallery-site-suggestions'] as Record<
      string,
      { styles: Array<{ name: string }> }
    >;
    expect(names(stored['github.com'].styles)).toEqual(['New']);
  });

  it('waits for a fetch once the stored styles are a week old', async () => {
    mockStorage({
      'gallery-site-suggestions': {
        'github.com': {
          styles: [{ ...galleryStyle, name: 'Old' }],
          fetchedAt: 0,
        },
      },
    });
    fetchMock.mockResponseOnce(page(['New']));

    expect(names(await getSiteSuggestions('github.com', 12, 7 * DAY))).toEqual([
      'New',
    ]);
  });

  it('keeps stale styles when the gallery cannot be reached', async () => {
    mockStorage({
      'gallery-site-suggestions': {
        'github.com': {
          styles: [{ ...galleryStyle, name: 'Old' }],
          fetchedAt: 0,
        },
      },
    });
    fetchMock.mockRejectOnce(new Error('offline'));

    expect(names(await getSiteSuggestions('github.com', 12, DAY))).toEqual([
      'Old',
    ]);
  });
});
