import fetchMock from 'jest-fetch-mock';

import { session, style } from '../../features/gallery/gallery.fixtures';
import {
  endGalleryPreviewOffSite,
  getGalleryPreview,
  installGalleryPreview,
  openGalleryPreview,
  startGalleryPreview,
  undoGalleryInstall,
} from './gallery-preview';
import { hashCss } from '@stylebot/gallery';
import type { GalleryListing, StyleMap } from '@stylebot/types';

import {
  getAll,
  installProfile,
  reinstallProfile,
  removeGalleryListing,
  restoreStyles,
} from './styles';

jest.mock('./styles', () => ({
  getAll: jest.fn(async () => ({})),
  installProfile: jest.fn(async () => ({ name: 'Tokyo Night', id: 'p1' })),
  reinstallProfile: jest.fn(async () => 'Mine'),
  removeGalleryListing: jest.fn(async () => undefined),
  applyStylesToAllTabs: jest.fn(async () => undefined),
  restoreStyles: jest.fn(async () => undefined),
}));

const TAB_ID = 7;
const GALLERY_TAB_ID = 3;

let store: Record<string, unknown>;

/**
 * Session and local storage share one in-memory store; their keys differ.
 */
const area = () => ({
  get: jest.fn(async (key: string) => ({ [key]: store[key] })),
  set: jest.fn(async (items: Record<string, unknown>) => {
    Object.assign(store, items);
  }),
});

const styleResponse = (css: string) =>
  fetchMock.mockResponseOnce(JSON.stringify({ ...style, css }));

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.resetMocks();
  store = {};
  global.chrome = {
    runtime: { lastError: undefined },
    storage: { session: area(), local: area() },
    tabs: {
      get: jest.fn(async () => ({ id: TAB_ID, url: 'https://github.com/' })),
      create: jest.fn(async () => ({ id: TAB_ID })),
      update: jest.fn(async () => ({ id: TAB_ID })),
      sendMessage: jest.fn(),
    },
  } as unknown as typeof chrome;
});

describe('gallery preview', () => {
  it('compiles a style, keeps it for the tab and its site, and tells the tab', async () => {
    styleResponse('@import url(https://example.com/a.css);\na { color: red; }');

    await startGalleryPreview(TAB_ID, style.id);

    const preview = await getGalleryPreview(TAB_ID);

    expect(preview).toMatchObject({
      style: { id: style.id, site: 'github.com' },
      css: 'a { color: red !important; }',
      importUrls: ['https://example.com/a.css'],
    });
    expect(store.galleryPreviewSites).toEqual(['github.com']);
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      TAB_ID,
      { name: 'ShowGalleryPreview', preview, replacedUrl: 'github.com' },
      expect.any(Function)
    );
  });

  it('tells the tab to replace the style it was installed in before', async () => {
    (getAll as jest.Mock).mockResolvedValue({
      'github.com': { css: 'p {}', enabled: true },
      'github.com/*': {
        css: 'a {}',
        enabled: true,
        readability: false,
        modifiedTime: '',
        activeProfile: 'p0',
        profiles: {
          p0: {
            name: 'Tokyo Night',
            galleryListing: {
              styleId: style.id,
              group: 'github.com',
              slug: 'tokyo-night',
              version: 2,
              cssHash: hashCss('a {}'),
              authorId: style.author.id,
            },
          },
        },
      },
    });
    styleResponse('a {}');

    await startGalleryPreview(TAB_ID, style.id);

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      TAB_ID,
      expect.objectContaining({ replacedUrl: 'github.com/*' }),
      expect.any(Function)
    );
  });

  it("doesn't tell a tab that isn't on a web page yet", async () => {
    (chrome.tabs.get as jest.Mock).mockResolvedValue({
      id: TAB_ID,
      url: 'about:blank',
    });
    styleResponse('a {}');

    await startGalleryPreview(TAB_ID, style.id);

    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
  });

  it('opens the style’s site only once its preview is saved', async () => {
    fetchMock.mockResponse(JSON.stringify({ ...style, css: 'a {}' }));
    (chrome.tabs.update as jest.Mock).mockImplementation(async () => {
      expect(store.galleryPreviewSites).toEqual(['github.com']);
    });

    await openGalleryPreview(style.id, {
      id: GALLERY_TAB_ID,
      index: 0,
      windowId: 1,
    } as chrome.tabs.Tab);

    expect(chrome.tabs.update).toHaveBeenCalledWith(TAB_ID, {
      url: 'https://github.com/',
    });
  });

  it('keeps the preview around the site, and ends it off the site', async () => {
    styleResponse('a {}');
    await startGalleryPreview(TAB_ID, style.id);

    await endGalleryPreviewOffSite(TAB_ID, 'https://www.github.com/issues');
    await endGalleryPreviewOffSite(TAB_ID, 'about:blank');
    expect(await getGalleryPreview(TAB_ID)).not.toBeNull();

    await endGalleryPreviewOffSite(TAB_ID, 'https://example.com/');
    expect(await getGalleryPreview(TAB_ID)).toBeNull();
    expect(store.galleryPreviewSites).toEqual([]);
  });

  it("installs the preview as a profile of the page's style and tells the gallery", async () => {
    store['gallery-install-id'] = 'install-1';
    (getAll as jest.Mock).mockResolvedValue({
      'github.com': { css: '', enabled: true },
    });
    styleResponse('a {}');
    await startGalleryPreview(TAB_ID, style.id, GALLERY_TAB_ID);
    fetchMock.mockResponseOnce(
      JSON.stringify({
        ...style,
        name: 'Tokyo Night',
        css: 'a { color: red; }',
      })
    );

    expect(await installGalleryPreview(TAB_ID)).toBe('Tokyo Night');
    expect(installProfile).toHaveBeenCalledWith('github.com', {
      name: 'Tokyo Night',
      css: 'a { color: red; }',
      galleryListing: {
        styleId: style.id,
        group: 'github.com',
        slug: 'tokyo-night',
        version: 2,
        cssHash: hashCss('a { color: red; }'),
        authorId: style.author.id,
      },
    });
    expect(await getGalleryPreview(TAB_ID)).toBeNull();
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      TAB_ID,
      { name: 'HideGalleryPreview', installed: true },
      expect.any(Function)
    );
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      GALLERY_TAB_ID,
      {
        name: 'GalleryStyleInstalled',
        id: style.id,
        profileName: 'Tokyo Night',
      },
      expect.any(Function)
    );
  });

  describe('installing a style installed or published here before', () => {
    const LATEST_CSS = 'a { color: blue; }';
    const LATEST_LISTING: GalleryListing = {
      styleId: style.id,
      group: 'github.com',
      slug: 'tokyo-night',
      version: 2,
      cssHash: hashCss(LATEST_CSS),
      authorId: style.author.id,
    };

    /**
     * Seeds github.com with one profile holding css and a gallery listing,
     * galleryListing, previews the style and queues the gallery's answer to the
     * install with its latest css.
     */
    const seed = async (css: string, galleryListing?: GalleryListing) => {
      store['gallery-install-id'] = 'install-1';
      (getAll as jest.Mock).mockResolvedValue({
        'github.com': {
          css,
          enabled: true,
          readability: false,
          modifiedTime: '',
          activeProfile: 'p0',
          profiles: { p0: { name: 'Mine', galleryListing } },
        },
      });
      styleResponse('a {}');
      await startGalleryPreview(TAB_ID, style.id);
      fetchMock.mockResponseOnce(
        JSON.stringify({ ...style, name: 'Tokyo Night', css: LATEST_CSS })
      );
    };

    const installedAt = (version: number, css: string): GalleryListing => ({
      ...LATEST_LISTING,
      version,
      cssHash: hashCss(css),
    });

    it('switches back to an install of the latest version, keeping its edits', async () => {
      await seed('a { color: pink; }', installedAt(2, 'a { color: red; }'));

      expect(await installGalleryPreview(TAB_ID)).toBe('Mine');
      expect(reinstallProfile).toHaveBeenCalledWith('github.com', 'p0', {});
      expect(installProfile).not.toHaveBeenCalled();
    });

    it('updates an untouched install of an older version in place', async () => {
      await seed('a { color: red; }', installedAt(1, 'a { color: red; }'));

      await installGalleryPreview(TAB_ID);

      expect(reinstallProfile).toHaveBeenCalledWith('github.com', 'p0', {
        css: LATEST_CSS,
        galleryListing: LATEST_LISTING,
      });
    });

    it('adds a newer version beside an edited install, which keeps the edits but loses the listing', async () => {
      await seed('a { color: pink; }', installedAt(1, 'a { color: red; }'));

      await installGalleryPreview(TAB_ID);

      expect(reinstallProfile).not.toHaveBeenCalled();
      expect(removeGalleryListing).toHaveBeenCalledWith('github.com', 'p0');
      expect(installProfile).toHaveBeenCalledWith('github.com', {
        name: 'Tokyo Night',
        css: LATEST_CSS,
        galleryListing: LATEST_LISTING,
      });
    });

    it('switches back to an edited, older copy of the signed-in account’s own style, keeping it as it is', async () => {
      await seed('a { color: pink; }', installedAt(1, 'a { color: red; }'));
      store['gallery-session'] = session;

      expect(await installGalleryPreview(TAB_ID)).toBe('Mine');
      expect(reinstallProfile).toHaveBeenCalledWith('github.com', 'p0', {});
      expect(removeGalleryListing).not.toHaveBeenCalled();
      expect(installProfile).not.toHaveBeenCalled();
    });

    it("installs anew when no profile has the style's listing", async () => {
      await seed('a { color: pink; }');

      await installGalleryPreview(TAB_ID);

      expect(reinstallProfile).not.toHaveBeenCalled();
      expect(removeGalleryListing).not.toHaveBeenCalled();
      expect(installProfile).toHaveBeenCalled();
    });
  });

  it('undoes an install, putting back only the styles it changed, and previews again', async () => {
    const before = {
      css: 'b {}',
      enabled: true,
      readability: false,
      modifiedTime: '1',
    };
    const untouched = { ...before, css: 'c {}' };

    store['gallery-install-id'] = 'install-1';
    let current: StyleMap = { 'github.com': before, 'x.com': untouched };

    (getAll as jest.Mock).mockImplementation(async () => current);
    (installProfile as jest.Mock).mockImplementationOnce(async () => {
      current = {
        'github.com': { ...before, css: 'a {}' },
        'gist.github.com': { ...before, css: 'a {}' },
        'x.com': untouched,
      };

      return { name: 'Hacker Hearth', id: 'p2' };
    });
    styleResponse('a {}');
    await startGalleryPreview(TAB_ID, style.id);
    const preview = await getGalleryPreview(TAB_ID);
    fetchMock.mockResponseOnce(JSON.stringify({ ...style, css: 'a {}' }));

    await installGalleryPreview(TAB_ID);
    await undoGalleryInstall(TAB_ID);

    expect(restoreStyles).toHaveBeenCalledWith({
      'github.com': before,
      'gist.github.com': null,
    });
    expect(await getGalleryPreview(TAB_ID)).toEqual(preview);
    await expect(undoGalleryInstall(TAB_ID)).rejects.toThrow();
  });
});
