import fetchMock from 'jest-fetch-mock';
import { GALLERY_API_URL, getListedStyleIds, hashCss } from '@stylebot/gallery';
import type { GalleryListing, StyleMap } from '@stylebot/types';

import {
  account,
  mockStorage,
  publishedStyle,
  session,
  style,
} from '../../features/gallery/gallery.fixtures';
import { captureTab } from './capture-tab';
import {
  CaptureGalleryScreenshot,
  CheckGalleryUsername,
  GetGalleryScreenshot,
  GetGalleryInstallStatus,
  GetGallerySuggestions,
  GetMyGalleryStyles,
  GetPublishedGalleryStyle,
  PublishToGallery,
  SetGalleryUsername,
  UnpublishFromGallery,
} from './gallery';

jest.mock('@stylebot/google-auth', () => ({
  getGoogleToken: jest.fn(async () => 'ya29.token'),
  clearGoogleToken: jest.fn(async () => undefined),
}));
jest.mock('./capture-tab', () => ({ captureTab: jest.fn() }));
jest.mock('./gallery-preview', () => ({}));
let mockGallerySuggestions: boolean;

jest.mock('./options', () => ({
  get: jest.fn(async () => mockGallerySuggestions),
}));
let mockStyles: StyleMap;

jest.mock('./styles', () => {
  const {
    expandProfiles,
    removeProfileGalleryListing,
    setProfileGalleryListing,
  } = jest.requireActual<typeof import('@stylebot/saved-styles')>(
    '@stylebot/saved-styles'
  );

  return {
    getAll: jest.fn(async () => mockStyles),
    setGalleryListing: jest.fn(
      async (url: string, id: string, galleryListing: GalleryListing) => {
        mockStyles[url] = setProfileGalleryListing(
          mockStyles[url],
          id,
          galleryListing
        );
      }
    ),
    removeStyleGalleryListings: jest.fn(async (styleId: number) => {
      for (const [url, saved] of Object.entries(mockStyles)) {
        const { sheets } = expandProfiles(saved);

        for (const [id, { galleryListing }] of Object.entries(sheets)) {
          if (galleryListing?.styleId === styleId) {
            mockStyles[url] = removeProfileGalleryListing(mockStyles[url], id);
          }
        }
      }
    }),
  };
});

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

const SCREENSHOT = 'data:image/png;base64,iVBORw0KGgo=';

const publishMessage = {
  name: 'PublishToGallery' as const,
  site: 'www.github.com',
  url: 'github.com',
  profileId: 'default',
  title: 'Tokyo Night',
  description: '',
  notes: '',
  css: 'body { color: red; }',
  screenshot: SCREENSHOT,
};

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
    'gallery-session': session,
    'gallery-suggestion-sites': {
      sites: ['github.com'],
      fetchedAt: Date.now(),
    },
  });
  mockStyles = { 'github.com': savedStyle() };
});

describe('gallery messages', () => {
  it("publishes a new style and remembers it for the style's profile", async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify(publishedStyle), { status: 201 })
      .mockResponseOnce(JSON.stringify({ styles: [style] }));

    const published = await respond(send =>
      PublishToGallery(publishMessage, send)
    );

    expect(published).toEqual({ ok: true, style: publishedStyle });
    expect(fetchMock.mock.calls[0][0]).toBe(`${GALLERY_API_URL}/styles`);

    const mine = await respond(send =>
      GetMyGalleryStyles(
        {
          name: 'GetMyGalleryStyles',
          site: 'www.github.com',
          url: 'github.com',
          profileId: 'default',
        },
        send
      )
    );

    expect(mine).toEqual({ ok: true, styles: [style], publishedId: style.id });
  });

  it('publishes a new version of the chosen style', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(publishedStyle));

    await respond(send =>
      PublishToGallery({ ...publishMessage, styleId: style.id }, send)
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${GALLERY_API_URL}/styles/${style.id}/versions`
    );
  });

  it("leaves the screenshot out of a new version that doesn't change it", async () => {
    fetchMock.mockResponseOnce(JSON.stringify(publishedStyle));

    await respond(send =>
      PublishToGallery(
        { ...publishMessage, styleId: style.id, screenshot: undefined },
        send
      )
    );

    const body = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(body.has('screenshot')).toBe(false);
  });

  describe('updating a published style', () => {
    const update = { ...publishMessage, styleId: style.id, notes: 'Darker' };

    beforeEach(() => {
      mockStyles = {
        'github.com': savedStyle({
          default: {
            name: '',
            css: publishMessage.css,
            galleryListing: {
              ...listing(style.id, style.slug, account.id),
              cssHash: hashCss(publishMessage.css),
            },
          },
        }),
      };
    });

    it("edits only the details when the CSS hasn't changed", async () => {
      fetchMock.mockResponseOnce(JSON.stringify(publishedStyle));

      await respond(send => PublishToGallery(update, send));

      const [url, init] = fetchMock.mock.calls[0];
      const body = init?.body as FormData;

      expect(url).toBe(`${GALLERY_API_URL}/styles/${style.id}`);
      expect(init?.method).toBe('PATCH');
      expect(body.has('css')).toBe(false);
      expect(body.has('notes')).toBe(false);
    });

    it('edits the details when the gallery finds the new CSS the same', async () => {
      fetchMock
        .mockResponseOnce(
          JSON.stringify({ error: 'Nothing changed.', code: 'css_unchanged' }),
          { status: 422 }
        )
        .mockResponseOnce(JSON.stringify(publishedStyle));

      const response = await respond(send =>
        PublishToGallery({ ...update, css: `${publishMessage.css}\n` }, send)
      );

      expect(response).toEqual({ ok: true, style: publishedStyle });
      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
        `${GALLERY_API_URL}/styles/${style.id}/versions`,
        `${GALLERY_API_URL}/styles/${style.id}`,
      ]);
    });
  });

  it('lists only styles for this site', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        styles: [style, { ...style, id: 10, site: 'example.com' }],
      })
    );

    const mine = await respond(send =>
      GetMyGalleryStyles(
        {
          name: 'GetMyGalleryStyles',
          site: 'github.com',
          url: 'github.com',
          profileId: 'default',
        },
        send
      )
    );

    expect(mine).toEqual({ ok: true, styles: [style], publishedId: null });
  });

  it('sets the username and keeps the stored account in step', async () => {
    const renamed = { ...account, username: 'maya-k' };
    fetchMock.mockResponseOnce(JSON.stringify(renamed));

    expect(
      await respond(send =>
        SetGalleryUsername(
          { name: 'SetGalleryUsername', username: 'maya-k' },
          send
        )
      )
    ).toEqual({ ok: true, account: renamed });

    const stored = await chrome.storage.local.get('gallery-session');
    expect(stored['gallery-session'].account).toEqual(renamed);
  });

  it('says why a username was turned down, not that a version clashed', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ error: 'That username is taken' }), {
        status: 409,
      })
      .mockResponseOnce(
        JSON.stringify({ error: 'That username is reserved' }),
        {
          status: 409,
        }
      );

    const set = (username: string) =>
      respond(send =>
        SetGalleryUsername({ name: 'SetGalleryUsername', username }, send)
      );

    await expect(set('maya')).resolves.toMatchObject({
      ok: false,
      errorKey: 'that_username_is_taken',
    });
    await expect(set('admin')).resolves.toMatchObject({
      ok: false,
      errorKey: 'that_username_is_reserved',
    });
  });

  it('checks whether a username is free', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        available: false,
        reason: 'taken',
        suggestion: 'maya-2',
      })
    );

    expect(
      await respond(send =>
        CheckGalleryUsername(
          { name: 'CheckGalleryUsername', username: 'maya' },
          send
        )
      )
    ).toEqual({
      ok: true,
      available: false,
      reason: 'taken',
      suggestion: 'maya-2',
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${GALLERY_API_URL}/usernames/maya`
    );
  });

  it("passes on the gallery's reason for turning a style down", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: 'The CSS is empty once sanitized.' }),
      { status: 400 }
    );

    expect(
      await respond(send => PublishToGallery(publishMessage, send))
    ).toMatchObject({
      ok: false,
      errorKey: 'gallery_error_invalid',
      errorDetail: 'The CSS is empty once sanitized.',
    });
  });

  it("remembers what was published from the style's profile", async () => {
    fetchMock.mockResponseOnce(JSON.stringify(publishedStyle), {
      status: 201,
    });

    await respond(send => PublishToGallery(publishMessage, send));

    expect(
      await respond(send =>
        GetPublishedGalleryStyle(
          {
            name: 'GetPublishedGalleryStyle',
            url: 'github.com',
            profileId: 'default',
          },
          send
        )
      )
    ).toEqual({
      published: {
        styleId: style.id,
        version: style.version,
        cssHash: hashCss(publishMessage.css),
        slug: style.slug,
      },
      installed: null,
    });
  });

  it('names the gallery style a profile was installed from, and counts an install of the account’s own style as published', async () => {
    const published = (profileId: string) =>
      respond(send =>
        GetPublishedGalleryStyle(
          { name: 'GetPublishedGalleryStyle', url: 'github.com', profileId },
          send
        )
      );
    mockStyles = {
      'github.com': savedStyle({
        p1: { name: 'Night', galleryListing: listing(7, 'night') },
        p2: {
          name: 'Mine',
          css: 'a {}',
          galleryListing: listing(8, 'mine', account.id),
        },
      }),
    };

    expect(await published('p1')).toEqual({
      published: null,
      installed: { id: 7, slug: 'night' },
    });
    expect(await published('p2')).toEqual({
      published: {
        styleId: 8,
        slug: 'mine',
        version: 1,
        cssHash: 'abc',
      },
      installed: null,
    });
    expect(await published('missing')).toEqual({
      published: null,
      installed: null,
    });
  });

  it('forgets an unpublished style', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify(publishedStyle), { status: 201 })
      .mockResponseOnce('', { status: 204 })
      .mockResponseOnce(JSON.stringify({ styles: [style] }));

    await respond(send => PublishToGallery(publishMessage, send));
    expect(
      await respond(send =>
        UnpublishFromGallery(
          { name: 'UnpublishFromGallery', id: style.id },
          send
        )
      )
    ).toEqual({ ok: true });

    const mine = await respond(send =>
      GetMyGalleryStyles(
        {
          name: 'GetMyGalleryStyles',
          site: 'github.com',
          url: 'github.com',
          profileId: 'default',
        },
        send
      )
    );

    expect(mine).toMatchObject({ publishedId: null });
  });

  it('forgets a style the gallery no longer has when updating it', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify(publishedStyle), { status: 201 })
      .mockResponseOnce(JSON.stringify({ error: 'Style not found' }), {
        status: 404,
      });

    await respond(send => PublishToGallery(publishMessage, send));

    expect(
      await respond(send =>
        PublishToGallery({ ...publishMessage, styleId: style.id }, send)
      )
    ).toMatchObject({ ok: false, errorKey: 'gallery_error_not_found' });
    expect(
      await respond(send =>
        GetPublishedGalleryStyle(
          {
            name: 'GetPublishedGalleryStyle',
            url: 'github.com',
            profileId: 'default',
          },
          send
        )
      )
    ).toEqual({ published: null, installed: null });
  });

  it('forgets a style the gallery no longer has when unpublishing it', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify(publishedStyle), { status: 201 })
      .mockResponseOnce(JSON.stringify({ error: 'Style not found' }), {
        status: 404,
      });

    await respond(send => PublishToGallery(publishMessage, send));

    expect(
      await respond(send =>
        UnpublishFromGallery(
          { name: 'UnpublishFromGallery', id: style.id },
          send
        )
      )
    ).toMatchObject({ ok: false, errorKey: 'gallery_error_not_found' });
    expect(getListedStyleIds(mockStyles).size).toBe(0);
  });

  it('keeps a published style when an update fails for another reason', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify(publishedStyle), { status: 201 })
      .mockResponseOnce(JSON.stringify({ error: 'Conflict' }), {
        status: 409,
      });

    await respond(send => PublishToGallery(publishMessage, send));
    await respond(send =>
      PublishToGallery({ ...publishMessage, styleId: style.id }, send)
    );

    expect(getListedStyleIds(mockStyles)).toEqual(new Set([style.id]));
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
      errorKey: 'gallery_error_screenshot',
    });
  });

  it('fetches the screenshot the gallery shows', async () => {
    // jsdom's FileReader only reads its own Blobs, not node-fetch's.
    fetchMock.mockImplementationOnce(
      async () =>
        ({
          ok: true,
          blob: async () => new Blob(['webp'], { type: 'image/webp' }),
        } as Response)
    );

    const response = await respond(send =>
      GetGalleryScreenshot(
        { name: 'GetGalleryScreenshot', path: style.screenshot },
        send
      )
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      new URL(style.screenshot, GALLERY_API_URL).href
    );
    expect(response).toEqual({
      ok: true,
      screenshot: 'data:image/webp;base64,d2VicA==',
    });
  });

  it("fails as a screenshot error when the gallery's is gone", async () => {
    fetchMock.mockResponseOnce('', { status: 404 });

    const response = await respond(send =>
      GetGalleryScreenshot(
        { name: 'GetGalleryScreenshot', path: style.screenshot },
        send
      )
    );

    expect(response).toMatchObject({
      ok: false,
      errorKey: 'gallery_error_screenshot',
    });
  });

  it("suggests the site's styles that are neither installed nor published here", async () => {
    const other = { ...style, id: 10, slug: 'other' };
    const installed = { ...style, id: 9, slug: 'installed' };
    mockStyles = {
      'github.com': savedStyle({
        default: {
          name: '',
          galleryListing: listing(style.id, style.slug, account.id),
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
