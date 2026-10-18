import fetchMock from 'jest-fetch-mock';

import { style } from '../../features/gallery/gallery.fixtures';
import {
  endGalleryPreviewOffSite,
  getGalleryPreview,
  installGalleryPreview,
  openGalleryPreview,
  startGalleryPreview,
} from './gallery-preview';
import { hashCss } from '@stylebot/gallery';

import { getAll, installProfile, reinstallProfile } from './styles';

jest.mock('./styles', () => ({
  getAll: jest.fn(async () => ({})),
  installProfile: jest.fn(async () => ({ name: 'Tokyo Night', id: 'p1' })),
  reinstallProfile: jest.fn(async () => 'Mine'),
  applyStylesToAllTabs: jest.fn(async () => undefined),
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
      { name: 'ShowGalleryPreview', preview },
      expect.any(Function)
    );
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
    });
    expect(store['gallery-installed']).toEqual({
      [style.id]: {
        url: 'github.com',
        profileId: 'p1',
        version: 2,
        group: 'github.com',
        slug: 'tokyo-night',
        cssHash: hashCss('a { color: red; }'),
      },
    });
    expect(await getGalleryPreview(TAB_ID)).toBeNull();
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      TAB_ID,
      { name: 'HideGalleryPreview' },
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

    /**
     * Seeds github.com with one profile holding css, previews the style and
     * queues the gallery's answer to the install with its latest css.
     */
    const seed = async (css: string) => {
      store['gallery-install-id'] = 'install-1';
      (getAll as jest.Mock).mockResolvedValue({
        'github.com': {
          css,
          enabled: true,
          readability: false,
          modifiedTime: '',
          activeProfile: 'p0',
          profiles: { p0: { name: 'Mine' } },
        },
      });
      styleResponse('a {}');
      await startGalleryPreview(TAB_ID, style.id);
      fetchMock.mockResponseOnce(
        JSON.stringify({ ...style, name: 'Tokyo Night', css: LATEST_CSS })
      );
    };

    const installedAt = (version: number, css: string) => {
      store['gallery-installed'] = {
        [style.id]: {
          url: 'github.com',
          profileId: 'p0',
          version,
          group: 'github.com',
          slug: 'tokyo-night',
          cssHash: hashCss(css),
        },
      };
    };

    it('switches back to an install of the latest version, keeping its edits', async () => {
      await seed('a { color: pink; }');
      installedAt(2, 'a { color: red; }');

      expect(await installGalleryPreview(TAB_ID)).toBe('Mine');
      expect(reinstallProfile).toHaveBeenCalledWith(
        'github.com',
        'p0',
        undefined
      );
      expect(installProfile).not.toHaveBeenCalled();
    });

    it('updates an untouched install of an older version in place', async () => {
      await seed('a { color: red; }');
      installedAt(1, 'a { color: red; }');

      await installGalleryPreview(TAB_ID);

      expect(reinstallProfile).toHaveBeenCalledWith(
        'github.com',
        'p0',
        LATEST_CSS
      );
      expect(store['gallery-installed']).toMatchObject({
        [style.id]: {
          profileId: 'p0',
          version: 2,
          cssHash: hashCss(LATEST_CSS),
        },
      });
    });

    it('adds a newer version beside an edited install and follows it', async () => {
      await seed('a { color: pink; }');
      installedAt(1, 'a { color: red; }');

      await installGalleryPreview(TAB_ID);

      expect(reinstallProfile).not.toHaveBeenCalled();
      expect(installProfile).toHaveBeenCalledWith('github.com', {
        name: 'Tokyo Night',
        css: LATEST_CSS,
      });
      expect(store['gallery-installed']).toMatchObject({
        [style.id]: { profileId: 'p1', version: 2 },
      });
    });

    it('switches to the profile it was published from rather than adding a copy', async () => {
      await seed('a { color: pink; }');
      store['gallery-published'] = {
        [JSON.stringify(['github.com', 'p0'])]: {
          styleId: style.id,
          version: 1,
          cssHash: hashCss('a { color: pink; }'),
          group: 'github.com',
          slug: 'tokyo-night',
          accountId: 'someone',
        },
      };

      expect(await installGalleryPreview(TAB_ID)).toBe('Mine');
      expect(reinstallProfile).toHaveBeenCalledWith(
        'github.com',
        'p0',
        undefined
      );
      expect(installProfile).not.toHaveBeenCalled();
      expect(store['gallery-installed']).toBeUndefined();
    });

    it('installs anew once the profile it was installed as is gone', async () => {
      await seed('a { color: pink; }');
      installedAt(2, 'a { color: red; }');
      (store['gallery-installed'] as Record<string, { profileId: string }>)[
        style.id
      ].profileId = 'removed';

      await installGalleryPreview(TAB_ID);

      expect(reinstallProfile).not.toHaveBeenCalled();
      expect(installProfile).toHaveBeenCalled();
    });
  });
});
