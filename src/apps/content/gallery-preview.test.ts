import {
  injectStylesheet,
  removeStylesheet,
  setStyleOptions,
} from '@stylebot/stylesheets';
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
  setStyleOptions: jest.fn(),
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

const remove = jest.fn();
const show = jest.fn();
const mount = jest.fn(() => ({ remove, show }));

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
        replacedUrls: ['example.com'],
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
    await showGalleryPreview(preview, ['example.com']);

    expect(removeStylesheet).toHaveBeenCalledWith('example.com');
    expect(removeStylesheet).not.toHaveBeenCalledWith('*');
    expect(injectStylesheet).toHaveBeenCalledWith(
      'stylebot:gallery-preview',
      'b {}',
      []
    );
    expect(mount).toHaveBeenCalledWith(preview, expect.any(Object));
    expect(isPreviewingGalleryStyle()).toBe(true);
  });

  it('removes every style it replaces', async () => {
    await showGalleryPreview(preview, ['https://example.com/', 'example.com']);

    expect(removeStylesheet).toHaveBeenCalledWith('https://example.com/');
    expect(removeStylesheet).toHaveBeenCalledWith('example.com');
    expect(removeStylesheet).not.toHaveBeenCalledWith('*');
  });

  describe('with options', () => {
    const withOptions: GalleryPreview = {
      ...preview,
      options: {
        scheme: {
          type: 'select',
          values: ['system', 'light', 'dark'],
          default: 'system',
        },
        accent: {
          type: 'select',
          label: 'Accent',
          values: ['mauve', 'blue'],
          default: 'mauve',
          choices: {
            mauve: { label: 'Mauve', css: '#cba6f7' },
            blue: { label: 'Blue', css: '#89b4fa' },
          },
        },
      },
      values: { scheme: 'dark', accent: 'mauve' },
    };

    it('shows a gallery style with the values its preview has', async () => {
      await showGalleryPreview(withOptions, ['example.com']);

      expect(setStyleOptions).toHaveBeenCalledWith({
        scheme: { value: 'dark', css: 'dark' },
        accent: { value: 'mauve', css: '#cba6f7' },
      });
    });

    it('shows a value picked in its controls, keeps it while comparing, and tells the background', async () => {
      await showGalleryPreview(withOptions, ['example.com']);
      const [, handlers] = mount.mock.calls[0] as unknown as [
        unknown,
        {
          setOption: (option: string, value: string) => void;
          compare: (on: boolean) => void;
        }
      ];
      const picked = {
        scheme: { value: 'dark', css: 'dark' },
        accent: { value: 'blue', css: '#89b4fa' },
      };

      handlers.setOption('accent', 'blue');
      await Promise.resolve();

      expect(setStyleOptions).toHaveBeenLastCalledWith(picked);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        name: 'SetGalleryPreviewOption',
        option: 'accent',
        value: 'blue',
      });

      handlers.compare(true);
      await new Promise(resolve => setTimeout(resolve));
      handlers.compare(false);
      await new Promise(resolve => setTimeout(resolve));

      expect(setStyleOptions).toHaveBeenLastCalledWith(picked);
    });
  });

  it("clears the page's options for a gallery style without any", async () => {
    await showGalleryPreview(preview, ['example.com']);

    expect(setStyleOptions).toHaveBeenCalledWith(undefined);
  });

  it("puts the page's own styles back when it's hidden", async () => {
    await showGalleryPreview(preview, ['example.com']);
    await hideGalleryPreview();

    expect(remove).toHaveBeenCalled();
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
    expect(mount).toHaveBeenCalledWith(preview, expect.any(Object));
    expect(removeStylesheet).toHaveBeenCalledWith('example.com');
  });
});
