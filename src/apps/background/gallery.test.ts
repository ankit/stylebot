import fetchMock from 'jest-fetch-mock';
import { GALLERY_API_URL } from '@stylebot/gallery';
import type { GalleryListing, StyleMap } from '@stylebot/types';

import { mockStorage, style } from '../../features/gallery/gallery.fixtures';
import { captureTab } from './capture-tab';
import {
  CaptureGalleryScreenshot,
  GetGalleryInstallStatus,
  GetGallerySuggestions,
  GetPublishedGalleryStyle,
} from './gallery';

jest.mock('./capture-tab', () => ({ captureTab: jest.fn() }));
jest.mock('./gallery-preview', () => ({}));
let mockGallerySuggestions: boolean;

jest.mock('./options', () => ({
  get: jest.fn(async () => mockGallerySuggestions),
}));
let mockStyles: StyleMap;

jest.mock('./styles', () => ({
  getAll: jest.fn(async () => mockStyles),
}));

const savedStyle = (profiles: StyleMap[string]['profiles'] = undefined) => ({
  css: '',
  enabled: true,
  readability: false,
  modifiedTime: '',
  ...(profiles ? { profiles, activeProfile: Object.keys(profiles)[0] } : {}),
});

const listing = (
  styleId: number,
  slug: string,
  authorId = 'someone'
): GalleryListing => ({
  styleId,
  slug,
  version: 1,
  cssHash: 'abc',
  authorId,
});

const respond = <T>(
  handler: (sendResponse: (response: T) => void) => Promise<void>
): Promise<T> =>
  new Promise(resolve => {
    handler(resolve);
  });

beforeEach(() => {
  // Failures are logged for debugging; the tests check what's sent back.
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  fetchMock.resetMocks();
  mockGallerySuggestions = true;
  mockStorage({
    'gallery-suggestion-sites': {
      sites: ['github.com'],
      fetchedAt: Date.now(),
    },
  });
  mockStyles = { 'github.com': savedStyle() };
});

describe('gallery messages', () => {
  it('names the gallery style a profile was installed from', async () => {
    const publishedFrom = (profileId: string) =>
      respond(send =>
        GetPublishedGalleryStyle(
          { name: 'GetPublishedGalleryStyle', url: 'github.com', profileId },
          send
        )
      );
    mockStyles = {
      'github.com': savedStyle({
        p1: { name: 'Night', galleryListing: listing(7, 'night') },
      }),
    };

    expect(await publishedFrom('p1')).toEqual({
      published: null,
      installed: { id: 7, slug: 'night' },
    });
    expect(await publishedFrom('missing')).toEqual({
      published: null,
      installed: null,
    });
  });

  it('captures the tab the message came from', async () => {
    const tab = { id: 4, windowId: 1, active: true } as chrome.tabs.Tab;
    (captureTab as jest.Mock).mockRejectedValueOnce(new Error('No access'));

    const response = await respond(send =>
      CaptureGalleryScreenshot(
        { name: 'CaptureGalleryScreenshot' },
        { tab },
        send
      )
    );

    expect(captureTab).toHaveBeenCalledWith(tab);
    expect(response).toMatchObject({
      ok: false,
      errorKey: 'gallery_error_unknown',
    });
  });

  it("suggests the site's styles that are neither installed nor published here", async () => {
    const other = { ...style, id: 10, slug: 'other' };
    const installed = { ...style, id: 9, slug: 'installed' };
    mockStyles = {
      'github.com': savedStyle({
        default: {
          name: '',
          galleryListing: listing(style.id, style.slug),
        },
        p1: {
          name: 'Installed',
          galleryListing: listing(9, 'installed'),
        },
      }),
    };
    fetchMock.mockResponseOnce(
      JSON.stringify({ styles: [style, installed, other], nextOffset: null })
    );

    const response = await respond(send =>
      GetGallerySuggestions(
        {
          name: 'GetGallerySuggestions',
          pageUrl: 'https://www.github.com/ankit',
          incognito: false,
        },
        send
      )
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${GALLERY_API_URL}/styles?site=github.com&limit=12`
    );
    expect(response).toEqual({
      ok: true,
      styles: [other],
      site: 'github.com',
    });
  });

  it('suggests an installed style again once its profile is removed', async () => {
    const installed = { ...style, id: 9, slug: 'installed' };
    mockStyles = {
      'github.com': savedStyle({ default: { name: '' } }),
    };
    fetchMock.mockResponseOnce(
      JSON.stringify({ styles: [installed], nextOffset: null })
    );

    const response = await respond(send =>
      GetGallerySuggestions(
        {
          name: 'GetGallerySuggestions',
          pageUrl: 'https://github.com/',
          incognito: false,
        },
        send
      )
    );

    expect(response).toMatchObject({ ok: true, styles: [installed] });
  });

  describe("doesn't ask the gallery", () => {
    const suggest = (pageUrl: string, incognito = false) =>
      respond(send =>
        GetGallerySuggestions(
          { name: 'GetGallerySuggestions', pageUrl, incognito },
          send
        )
      );

    it('with suggestions turned off', async () => {
      mockGallerySuggestions = false;

      expect(await suggest('https://github.com/')).toMatchObject({
        ok: true,
        styles: [],
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('from an incognito tab', async () => {
      expect(await suggest('https://github.com/', true)).toMatchObject({
        styles: [],
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('about a site the gallery has no styles for', async () => {
      expect(await suggest('https://example.org/')).toMatchObject({
        styles: [],
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('about a local or internal address', async () => {
      for (const pageUrl of [
        'http://localhost:3000/',
        'http://192.168.1.1/',
        'https://jira.corp/',
        'https://github.com:8443/',
      ]) {
        expect(await suggest(pageUrl)).toMatchObject({ styles: [] });
      }

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('install status', () => {
    const installedStyles = () => {
      (global.chrome as { runtime?: unknown }).runtime = { id: 'stylebot' };
      mockStyles = {
        'github.com': savedStyle({
          p1: { name: 'Night', galleryListing: listing(7, 'night') },
        }),
      };
    };

    const status = (styleIds: unknown, url: string) =>
      respond(send =>
        GetGalleryInstallStatus(
          {
            name: 'GetGalleryInstallStatus',
            styleIds: styleIds as Array<number>,
          },
          { id: 'stylebot', url },
          send
        )
      );

    it('names the requested styles that are installed', async () => {
      installedStyles();

      expect(
        await status(
          [7, 10, '7', 7.5, -7],
          'https://gallery.stylebot.dev/site/github.com'
        )
      ).toEqual({ installed: { 7: 'Night' } });
    });

    it('tells other sites nothing', async () => {
      installedStyles();

      expect(await status([7], 'https://example.com/')).toEqual({
        installed: {},
      });
    });

    it('only looks up the first 100 ids', async () => {
      installedStyles();
      const ids = [...Array.from({ length: 100 }, (_, i) => i + 100), 7];

      expect(await status(ids, 'https://stylebot.dev/')).toEqual({
        installed: {},
      });
    });
  });
});
