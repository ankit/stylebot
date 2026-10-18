import fetchMock from 'jest-fetch-mock';

import { style } from '../../features/gallery/gallery.fixtures';
import {
  endGalleryPreviewOffSite,
  getGalleryPreview,
  installGalleryPreview,
  openGalleryPreview,
  startGalleryPreview,
} from './gallery-preview';
import { getAll, installProfile } from './styles';

jest.mock('./styles', () => ({
  getAll: jest.fn(async () => ({})),
  installProfile: jest.fn(async () => ({ name: 'Tokyo Night', id: 'p1' })),
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
});
