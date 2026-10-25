import fetchMock from 'jest-fetch-mock';
import {
  GALLERY_API_URL,
  getGalleryPublishUrl,
  hashCss,
} from '@stylebot/gallery';
import type {
  GalleryListing,
  GetGalleryDraftResponse,
  StyleMap,
} from '@stylebot/types';

import { mockStorage, style } from '../../features/gallery/gallery.fixtures';
import { compressScreenshot } from '../../features/gallery/compress-screenshot';
import { captureTab } from './capture-tab';
import {
  CaptureGalleryScreenshot,
  GalleryDraftPublished,
  GalleryStyleDeleted,
  GetGalleryDraft,
  GetGalleryInstallStatus,
  GetGallerySuggestions,
  GetPublishedGalleryStyle,
  OpenGalleryDraft,
  PublishGalleryStyleUpdate,
  PublishProfileToGallery,
  ResetGalleryProfile,
} from './gallery';
import {
  applyStylesToAllTabs,
  removeStyleGalleryListings,
  resetGalleryProfile,
} from './styles';

jest.mock('./capture-tab', () => ({ captureTab: jest.fn() }));
jest.mock('./gallery-preview', () => ({
  getLatestVersionListing:
    jest.requireActual('./gallery-preview').getLatestVersionListing,
}));
jest.mock('../../features/gallery/compress-screenshot', () => ({
  compressScreenshot: jest.fn(
    async () => new Blob(['webp'], { type: 'image/webp' })
  ),
}));
let mockGallerySuggestions: boolean;

jest.mock('./options', () => ({
  get: jest.fn(async () => mockGallerySuggestions),
}));
let mockStyles: StyleMap;

jest.mock('./styles', () => {
  const { setProfileGalleryListing } = jest.requireActual<
    typeof import('@stylebot/saved-styles')
  >('@stylebot/saved-styles');

  return {
    getAll: jest.fn(async () => mockStyles),
    setActiveProfile: jest.fn(async (url: string, activeProfile: string) => {
      mockStyles[url] = { ...mockStyles[url], activeProfile };
    }),
    enable: jest.fn(async (url: string) => {
      mockStyles[url] = { ...mockStyles[url], enabled: true };
    }),
    applyStylesToAllTabs: jest.fn(async () => undefined),
    removeStyleGalleryListings: jest.fn(async () => undefined),
    resetGalleryProfile: jest.fn(async () => undefined),
    setGalleryListing: jest.fn(
      async (url: string, id: string, galleryListing: GalleryListing) => {
        mockStyles[url] = setProfileGalleryListing(
          mockStyles[url],
          id,
          galleryListing
        );
      }
    ),
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
  published = false
): GalleryListing => ({
  styleId,
  slug,
  version: 1,
  cssHash: 'abc',
  published,
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
  describe('drafts', () => {
    const CSS = 'body { color: red; }';
    const GALLERY = {
      id: 'stylebot',
      url: 'https://gallery.stylebot.dev/publish',
    };

    let createTab: jest.Mock;
    let updateTab: jest.Mock;

    beforeEach(() => {
      createTab = jest.fn(async () => ({}));
      updateTab = jest.fn(async () => ({}));
      Object.assign(global.chrome, {
        runtime: { id: 'stylebot' },
        tabs: {
          create: createTab,
          update: updateTab,
          get: jest.fn(async (id: number) => ({ id, windowId: 1 })),
        },
      });
    });

    /**
     * Opens a draft of github.com's default profile from tab 3, and resolves
     * with the id the publish page was opened with.
     */
    const openDraft = async (screenshot: string | null = null) => {
      await respond(send =>
        OpenGalleryDraft(
          {
            name: 'OpenGalleryDraft',
            url: 'github.com',
            profileId: 'default',
            css: CSS,
            profileName: 'Night',
            screenshot,
          },
          { tab: { id: 3 } as chrome.tabs.Tab },
          send
        )
      );

      const { url } = createTab.mock.calls[0][0] as { url: string };

      return new URL(url).searchParams.get('draft') as string;
    };

    const getDraft = (id: string, sender = GALLERY) =>
      respond<GetGalleryDraftResponse>(send =>
        GetGalleryDraft({ name: 'GetGalleryDraft', id }, sender, send)
      );

    const published = (id: string, sender = GALLERY) =>
      respond(send =>
        GalleryDraftPublished(
          {
            name: 'GalleryDraftPublished',
            id,
            styleId: 9,
            version: 3,
            slug: 'night',
          },
          sender,
          send
        )
      );

    it('opens the publish page beside the tab, on a draft the gallery can read', async () => {
      const id = await openDraft();

      expect(createTab).toHaveBeenCalledWith({
        url: getGalleryPublishUrl(id),
        openerTabId: 3,
      });
      expect(await getDraft(id)).toEqual({
        draft: {
          site: 'github.com',
          url: 'github.com',
          css: CSS,
          name: 'Night',
          screenshot: null,
          styleId: null,
        },
      });
    });

    it('fits the screenshot to the gallery’s limit', async () => {
      const id = await openDraft('data:image/png;base64,iVBORw0KGgo=');
      const { draft } = await getDraft(id);

      expect(draft?.screenshot).toMatch(/^data:image\/webp;base64,/);
    });

    it('opens the publish page before fitting the screenshot, and gives the draft once it fits', async () => {
      let fitted: (blob: Blob) => void = () => undefined;
      jest
        .mocked(compressScreenshot)
        .mockImplementationOnce(
          () => new Promise(resolve => (fitted = resolve))
        );

      const opened = respond(send =>
        OpenGalleryDraft(
          {
            name: 'OpenGalleryDraft',
            url: 'github.com',
            profileId: 'default',
            css: CSS,
            profileName: 'Night',
            screenshot: 'data:image/png;base64,iVBORw0KGgo=',
          },
          { tab: { id: 3 } as chrome.tabs.Tab },
          send
        )
      );

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(createTab).toHaveBeenCalled();
      const { url } = createTab.mock.calls[0][0] as { url: string };
      const draft = getDraft(new URL(url).searchParams.get('draft') as string);

      fitted(new Blob(['webp'], { type: 'image/webp' }));

      expect(await opened).toEqual({ ok: true });
      expect((await draft).draft?.screenshot).toMatch(/^data:image\/webp;/);
    });

    it('updates the gallery style the profile was published as, not one it was installed from', async () => {
      mockStyles = {
        'github.com': savedStyle({
          default: { name: '', galleryListing: listing(8, 'mine', true) },
          other: { name: 'Other', galleryListing: listing(7, 'night') },
        }),
      };

      const { draft } = await getDraft(await openDraft());
      expect(draft?.styleId).toBe(8);

      createTab.mockClear();
      mockStyles['github.com'].activeProfile = 'other';
      await respond(send =>
        OpenGalleryDraft(
          {
            name: 'OpenGalleryDraft',
            url: 'github.com',
            profileId: 'other',
            css: CSS,
            profileName: 'Other',
            screenshot: null,
          },
          {},
          send
        )
      );
      const { url } = createTab.mock.calls[0][0] as { url: string };
      const other = await getDraft(
        new URL(url).searchParams.get('draft') as string
      );

      expect(other.draft?.styleId).toBeNull();
    });

    it('gives drafts only to the gallery', async () => {
      const id = await openDraft();

      expect(
        await getDraft(id, { id: 'stylebot', url: 'https://stylebot.dev/' })
      ).toEqual({ draft: null });
      expect(
        await getDraft(id, {
          id: 'stylebot',
          url: 'https://gallery.stylebot.dev.example.com/',
        })
      ).toEqual({ draft: null });
      expect(await getDraft(id, { id: 'other', url: GALLERY.url })).toEqual({
        draft: null,
      });
      expect(
        await published(id, { id: 'stylebot', url: 'https://example.com/' })
      ).toEqual({
        ok: false,
      });
    });

    it("remembers what was published on the draft's profile, hashing the draft's CSS, and forgets the draft", async () => {
      const id = await openDraft();

      expect(await published(id)).toEqual({ ok: true });
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
          styleId: 9,
          version: 3,
          cssHash: hashCss(CSS),
          slug: 'night',
        },
        installed: null,
      });
      expect(await getDraft(id)).toEqual({ draft: null });
      expect(await published(id)).toEqual({ ok: false });
    });

    describe("the popup's Publish", () => {
      const publishFromPopup = (profileId: string) =>
        respond(send =>
          PublishProfileToGallery(
            {
              name: 'PublishProfileToGallery',
              tabId: 3,
              url: 'github.com',
              profileId,
            },
            send
          )
        );

      beforeEach(() => {
        (applyStylesToAllTabs as jest.Mock).mockClear();
        jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
        mockStyles = {
          'github.com': {
            ...savedStyle({
              default: { name: '' },
              dark: { name: 'Dark', css: CSS },
            }),
            css: 'a {}',
          },
        };
        (captureTab as jest.Mock).mockResolvedValue(
          'data:image/png;base64,iVBORw0KGgo='
        );
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('shows the profile on the tab, captures it and opens a draft of it', async () => {
        const published = publishFromPopup('dark');
        await jest.runAllTimersAsync();

        expect(await published).toEqual({ ok: true });
        expect(mockStyles['github.com'].activeProfile).toBe('dark');
        expect(applyStylesToAllTabs).toHaveBeenCalled();
        expect(captureTab).toHaveBeenCalledWith({ id: 3, windowId: 1 });

        const { url, openerTabId } = createTab.mock.calls[0][0];
        const { draft } = await getDraft(
          new URL(url).searchParams.get('draft') as string
        );

        expect(openerTabId).toBe(3);
        expect(draft).toMatchObject({ css: CSS, name: 'Dark' });
        expect(draft?.screenshot).toMatch(/^data:image\/webp;base64,/);
      });

      it('captures the profile showing without switching, and opens a draft without a screenshot when the capture fails', async () => {
        (captureTab as jest.Mock).mockRejectedValueOnce(new Error('No access'));

        expect(await publishFromPopup('default')).toEqual({ ok: true });
        expect(applyStylesToAllTabs).not.toHaveBeenCalled();

        const { url } = createTab.mock.calls[0][0];
        const { draft } = await getDraft(
          new URL(url).searchParams.get('draft') as string
        );

        expect(draft).toMatchObject({ css: 'a {}', screenshot: null });
      });

      it('turns a style that is off on before capturing it', async () => {
        mockStyles['github.com'] = {
          ...mockStyles['github.com'],
          enabled: false,
        };

        const published = publishFromPopup('default');
        await jest.runAllTimersAsync();

        expect(await published).toEqual({ ok: true });
        expect(mockStyles['github.com'].enabled).toBe(true);
        expect(applyStylesToAllTabs).toHaveBeenCalled();
        expect(captureTab).toHaveBeenCalled();
      });

      it("from the options page, with no tab, leaves the site's profile alone and opens a draft without a screenshot", async () => {
        (captureTab as jest.Mock).mockClear();

        const published = await respond(send =>
          PublishProfileToGallery(
            {
              name: 'PublishProfileToGallery',
              url: 'github.com',
              profileId: 'dark',
            },
            send
          )
        );

        expect(published).toEqual({ ok: true });
        expect(mockStyles['github.com'].activeProfile).toBe('default');
        expect(applyStylesToAllTabs).not.toHaveBeenCalled();
        expect(captureTab).not.toHaveBeenCalled();

        const { url, openerTabId } = createTab.mock.calls[0][0];
        const { draft } = await getDraft(
          new URL(url).searchParams.get('draft') as string
        );

        expect(openerTabId).toBeUndefined();
        expect(draft).toMatchObject({
          css: CSS,
          name: 'Dark',
          screenshot: null,
        });
      });
    });

    describe("the gallery's Publish update", () => {
      const GALLERY_TAB = { ...GALLERY, tab: { id: 5 } as chrome.tabs.Tab };

      const publishUpdate = (
        styleId: unknown,
        sender: chrome.runtime.MessageSender = GALLERY_TAB
      ) =>
        respond(send =>
          PublishGalleryStyleUpdate(
            {
              name: 'PublishGalleryStyleUpdate',
              styleId: styleId as number,
            },
            sender,
            send
          )
        );

      beforeEach(() => {
        mockStyles = {
          'github.com': savedStyle({
            default: { name: '' },
            mine: {
              name: 'Mine',
              css: CSS,
              galleryListing: listing(8, 'mine', true),
            },
            twice: { name: 'Twice', galleryListing: listing(9, 'twice', true) },
            night: { name: 'Night', galleryListing: listing(7, 'night') },
          }),
          'example.com': savedStyle({
            twice: { name: 'Twice', galleryListing: listing(9, 'twice', true) },
          }),
        };
      });

      it("takes the gallery's tab to the publish page, on a draft of the profile published as the style", async () => {
        expect(await publishUpdate(8)).toEqual({ ok: true });
        expect(createTab).not.toHaveBeenCalled();

        const [tabId, { url }] = updateTab.mock.calls[0] as [
          number,
          { url: string }
        ];
        const id = new URL(url).searchParams.get('draft') as string;

        expect(tabId).toBe(5);
        expect(url).toBe(getGalleryPublishUrl(id));
        expect(await getDraft(id)).toEqual({
          draft: {
            site: 'github.com',
            url: 'github.com',
            css: CSS,
            name: 'Mine',
            screenshot: null,
            styleId: 8,
          },
        });
      });

      it('turns down a style installed, published from several profiles, or not here', async () => {
        for (const styleId of [7, 9, 99, -1]) {
          expect(await publishUpdate(styleId)).toMatchObject({ ok: false });
        }

        expect(updateTab).not.toHaveBeenCalled();
      });

      it('turns down other sites, and messages without a tab', async () => {
        expect(
          await publishUpdate(8, {
            id: 'stylebot',
            url: 'https://stylebot.dev/',
            tab: GALLERY_TAB.tab,
          })
        ).toMatchObject({ ok: false });
        expect(await publishUpdate(8, GALLERY)).toMatchObject({ ok: false });
        expect(updateTab).not.toHaveBeenCalled();
      });
    });

    it('turns down a publish that names no gallery style', async () => {
      const id = await openDraft();

      expect(
        await respond(send =>
          GalleryDraftPublished(
            {
              name: 'GalleryDraftPublished',
              id,
              styleId: -1,
              version: 1,
              slug: 'night',
            },
            GALLERY,
            send
          )
        )
      ).toEqual({ ok: false });
      expect((await getDraft(id)).draft).not.toBeNull();
    });
  });

  it('names the gallery style a profile was installed from, and what was published from another', async () => {
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
        p2: {
          name: 'Mine',
          css: 'a {}',
          galleryListing: listing(8, 'mine', true),
        },
      }),
    };

    expect(await publishedFrom('p1')).toEqual({
      published: null,
      installed: { id: 7, slug: 'night', cssHash: 'abc' },
    });
    expect(await publishedFrom('p2')).toEqual({
      published: {
        styleId: 8,
        slug: 'mine',
        version: 1,
        cssHash: 'abc',
      },
      installed: null,
    });
    expect(await publishedFrom('missing')).toEqual({
      published: null,
      installed: null,
    });
  });

  describe('resetting a profile to its gallery version', () => {
    const reset = (profileId: string) =>
      respond(send =>
        ResetGalleryProfile(
          { name: 'ResetGalleryProfile', url: 'github.com', profileId },
          send
        )
      );

    beforeEach(() => {
      jest.clearAllMocks();
      mockStyles = {
        'github.com': savedStyle({
          p1: {
            name: 'Night',
            css: 'a { color: pink; }',
            galleryListing: listing(42, 'tokyo-night'),
          },
        }),
      };
    });

    it('puts the latest version back in place of the edits', async () => {
      const css = 'a { color: red; }';
      fetchMock.mockResponseOnce(JSON.stringify({ ...style, css }));

      expect(await reset('p1')).toEqual({ ok: true });
      expect(fetchMock.mock.calls[0][0]).toBe(`${GALLERY_API_URL}/styles/42`);
      expect(resetGalleryProfile).toHaveBeenCalledWith(
        'github.com',
        'p1',
        css,
        {
          styleId: 42,
          slug: 'tokyo-night',
          version: 2,
          cssHash: hashCss(css),
          published: false,
        }
      );
      expect(applyStylesToAllTabs).toHaveBeenCalled();
    });

    it('fails and drops the listings when the gallery no longer has the style', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ error: 'Not found' }), {
        status: 404,
      });

      const response = await reset('p1');

      expect(response).toMatchObject({
        ok: false,
        errorKey: 'gallery_error_not_found',
      });
      expect(resetGalleryProfile).not.toHaveBeenCalled();
      expect(removeStyleGalleryListings).toHaveBeenCalledWith(42);
    });

    it('fails and drops the listings when the id now names another style', async () => {
      mockStyles['github.com'] = savedStyle({
        p1: {
          name: 'Night',
          css: 'a { color: pink; }',
          galleryListing: { ...listing(42, 'tokyo-night'), version: 5 },
        },
      });
      fetchMock.mockResponseOnce(JSON.stringify(style));

      const response = await reset('p1');

      expect(response).toEqual({
        ok: false,
        errorKey: 'gallery_error_not_found',
      });
      expect(resetGalleryProfile).not.toHaveBeenCalled();
      expect(removeStyleGalleryListings).toHaveBeenCalledWith(42);
    });

    it('keeps the listings when the gallery can’t be reached', async () => {
      fetchMock.mockRejectOnce(new TypeError('Failed to fetch'));

      const response = await reset('p1');

      expect(response).toMatchObject({
        ok: false,
        errorKey: 'gallery_error_network',
      });
      expect(removeStyleGalleryListings).not.toHaveBeenCalled();
    });

    it('fails for a profile not installed from the gallery', async () => {
      const response = await reset('missing');

      expect(response).toMatchObject({ ok: false });
      expect(fetchMock).not.toHaveBeenCalled();
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

  it("suggests the site's styles that are neither installed nor published here, with the site's total", async () => {
    const other = { ...style, id: 10, slug: 'other' };
    const installed = { ...style, id: 9, slug: 'installed' };
    mockStyles = {
      'github.com': savedStyle({
        default: {
          name: '',
          galleryListing: listing(style.id, style.slug, true),
        },
        p1: {
          name: 'Installed',
          galleryListing: listing(9, 'installed'),
        },
      }),
    };
    fetchMock.mockResponseOnce(
      JSON.stringify({
        styles: [style, installed, other],
        nextOffset: null,
        total: 14,
      })
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
      total: 14,
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
      ).toEqual({ installed: { 7: 'Night' }, published: {} });
    });

    it('tells other sites nothing', async () => {
      installedStyles();

      expect(await status([7], 'https://example.com/')).toEqual({
        installed: {},
        published: {},
      });
    });

    describe('of styles published from here', () => {
      beforeEach(() => {
        (global.chrome as { runtime?: unknown }).runtime = { id: 'stylebot' };
        mockStyles = {
          'github.com': savedStyle({
            default: { name: '' },
            p1: {
              name: 'Dim',
              css: 'a {}',
              galleryListing: {
                ...listing(8, 'dim', true),
                version: 4,
                cssHash: hashCss('a {}'),
              },
            },
            p2: {
              name: 'Edited',
              css: 'b { color: red; }',
              galleryListing: listing(9, 'edited', true),
            },
          }),
        };
      });

      it('gives their versions and whether they were edited since, to the gallery', async () => {
        expect(
          await status([8, 9], 'https://gallery.stylebot.dev/mine')
        ).toEqual({
          installed: { 8: 'Dim', 9: 'Edited' },
          published: {
            8: { version: 4, changed: false },
            9: { version: 1, changed: true },
          },
        });
      });

      it('leaves them out for stylebot.dev', async () => {
        expect(await status([8, 9], 'https://stylebot.dev/')).toMatchObject({
          published: {},
        });
      });
    });

    it('only looks up the first 100 ids', async () => {
      installedStyles();
      const ids = [...Array.from({ length: 100 }, (_, i) => i + 100), 7];

      expect(await status(ids, 'https://stylebot.dev/')).toEqual({
        installed: {},
        published: {},
      });
    });
  });

  describe('deleted styles', () => {
    const deleted = (styleId: unknown, url: string) =>
      respond(send =>
        GalleryStyleDeleted(
          { name: 'GalleryStyleDeleted', styleId: styleId as number },
          { id: 'stylebot', url },
          send
        )
      );

    beforeEach(() => {
      (global.chrome as { runtime?: unknown }).runtime = { id: 'stylebot' };
      jest.mocked(removeStyleGalleryListings).mockClear();
    });

    it('forgets the listings of a style the gallery deleted', async () => {
      expect(await deleted(7, 'https://gallery.stylebot.dev/me')).toEqual({
        ok: true,
      });
      expect(removeStyleGalleryListings).toHaveBeenCalledWith(7);
    });

    it('ignores other sites and ids that aren’t a style’s', async () => {
      expect(await deleted(7, 'https://example.com/')).toEqual({ ok: false });
      expect(await deleted('7', 'https://gallery.stylebot.dev/me')).toEqual({
        ok: false,
      });
      expect(removeStyleGalleryListings).not.toHaveBeenCalled();
    });
  });
});
