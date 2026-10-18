import { injectStylesheet, removeStylesheet } from '@stylebot/stylesheets';
import type { GalleryPreview } from '@stylebot/types';

import { style } from '../../features/gallery/gallery.fixtures';
import {
  hideGalleryPreview,
  isPreviewingGalleryStyle,
  resumeGalleryPreview,
  showGalleryPreview,
} from './gallery-preview';
import { applyPageState } from './page-state';
import { getCompiledStyles } from './saved-styles';

jest.mock('@stylebot/stylesheets', () => ({
  injectStylesheet: jest.fn(),
  removeStylesheet: jest.fn(),
}));
jest.mock('./page-state', () => ({
  applyPageState: jest.fn(),
  getPageState: () => ({
    styles: [
      { url: '*', css: 'p {}', importUrls: [], enabled: true },
      { url: 'example.com', css: 'a {}', importUrls: [], enabled: true },
    ],
    readability: false,
  }),
}));
jest.mock('./saved-styles', () => ({ getCompiledStyles: jest.fn() }));

const preview: GalleryPreview = {
  style: { ...style, site: 'localhost' },
  css: 'b {}',
  importUrls: [],
};

const unmount = jest.fn();
const mount = jest.fn(() => unmount);

beforeEach(async () => {
  jest.clearAllMocks();
  (getCompiledStyles as jest.Mock).mockResolvedValue({});
  window.matchMedia = jest.fn(() => ({ matches: false })) as never;
  (
    window as { stylebotGalleryPreviewApp?: unknown }
  ).stylebotGalleryPreviewApp = { mount };
  global.chrome = {
    runtime: {
      sendMessage: jest.fn(async () => ({
        preview,
        replacedUrl: 'example.com',
      })),
    },
    storage: {
      local: { get: jest.fn(async () => ({ galleryPreviewSites: [] })) },
    },
  } as unknown as typeof chrome;

  await hideGalleryPreview();
  jest.clearAllMocks();
});

describe('gallery preview on the page', () => {
  it('shows a gallery style in place of the style it would replace, with its controls', async () => {
    await showGalleryPreview(preview, 'example.com');

    expect(removeStylesheet).toHaveBeenCalledWith('example.com');
    expect(removeStylesheet).not.toHaveBeenCalledWith('*');
    expect(injectStylesheet).toHaveBeenCalledWith(
      'stylebot:gallery-preview',
      'b {}',
      []
    );
    expect(mount).toHaveBeenCalledWith(preview.style, expect.any(Object));
    expect(isPreviewingGalleryStyle()).toBe(true);
  });

  it("puts the page's own styles back when it's hidden", async () => {
    await showGalleryPreview(preview, 'example.com');
    await hideGalleryPreview();

    expect(unmount).toHaveBeenCalled();
    expect(removeStylesheet).toHaveBeenCalledWith('stylebot:gallery-preview');
    expect(applyPageState).toHaveBeenCalled();
    expect(isPreviewingGalleryStyle()).toBe(false);
  });

  it("doesn't ask the background on sites no tab previews", async () => {
    await resumeGalleryPreview();

    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    expect(mount).not.toHaveBeenCalled();
  });

  it("shows the tab's preview again on its site's next page", async () => {
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      galleryPreviewSites: ['localhost'],
    });

    await resumeGalleryPreview();

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      name: 'GetGalleryPreview',
    });
    expect(mount).toHaveBeenCalledWith(preview.style, expect.any(Object));
    expect(removeStylesheet).toHaveBeenCalledWith('example.com');
  });
});
