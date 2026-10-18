import {
  GALLERY_PREVIEW_SITES_KEY,
  toGallerySite,
  type GalleryPreviewAppWindow,
} from '@stylebot/gallery';
import { injectStylesheet, removeStylesheet } from '@stylebot/stylesheets';
import type {
  EndGalleryPreview,
  GalleryPreview,
  GetGalleryPreview,
  GetGalleryPreviewResponse,
  InstallGalleryPreview,
  InstallGalleryPreviewResponse,
} from '@stylebot/types';

import { applyPageState, getPageState } from './page-state';
import { getCompiledStyles } from './saved-styles';

// Keyed like a saved style's url, but no saved style can have it.
const PREVIEW_KEY = 'stylebot:gallery-preview';

// Shared by Stylebot's scripts on the page, which each bundle this module.
type PreviewWindow = GalleryPreviewAppWindow & {
  stylebotGalleryPreview?: {
    preview: GalleryPreview;
    unmount?: () => void;
  };
};

const shared = window as PreviewWindow;

/**
 * Whether the page shows a gallery style in place of its own, so saved
 * styles changing elsewhere leave it alone.
 */
export const isPreviewingGalleryStyle = (): boolean =>
  Boolean(shared.stylebotGalleryPreview);

const applyOwnStyles = async (): Promise<void> =>
  applyPageState(getPageState(await getCompiledStyles()));

const applyPreview = async ({
  css,
  importUrls,
}: GalleryPreview): Promise<void> => {
  const state = getPageState(await getCompiledStyles());

  state.styles.forEach(style => removeStylesheet(style.url));
  injectStylesheet(PREVIEW_KEY, css, importUrls);
};

const CROSSFADE_ID = 'stylebot-gallery-preview-crossfade';

const CROSSFADE_CSS = `
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 280ms;
  animation-timing-function: ease;
}
`;

type TransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void>) => {
    updateCallbackDone: Promise<void>;
  };
};

/**
 * Crossfades the page from how it looks now to how `update` leaves it, where
 * the browser can and the user hasn't asked for less motion.
 */
const crossfade = async (update: () => Promise<void>): Promise<void> => {
  const doc = document as TransitionDocument;
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (!doc.startViewTransition || reduceMotion) {
    await update();
    return;
  }

  if (!document.getElementById(CROSSFADE_ID)) {
    const style = document.createElement('style');

    style.id = CROSSFADE_ID;
    style.textContent = CROSSFADE_CSS;
    (document.head || document.documentElement).append(style);
  }

  await doc.startViewTransition(update).updateCallbackDone;
};

const load = async () => {
  if (!shared.stylebotGalleryPreviewApp) {
    await import(
      /* webpackIgnore: true */ chrome.runtime.getURL(
        'gallery-preview/index.js'
      )
    );
  }

  return shared.stylebotGalleryPreviewApp;
};

const install = (): Promise<InstallGalleryPreviewResponse> => {
  const message: InstallGalleryPreview = { name: 'InstallGalleryPreview' };

  return chrome.runtime.sendMessage<
    InstallGalleryPreview,
    InstallGalleryPreviewResponse
  >(message);
};

const cancel = (): void => {
  const message: EndGalleryPreview = { name: 'EndGalleryPreview' };
  chrome.runtime.sendMessage(message);
};

const compare = (on: boolean): void => {
  const current = shared.stylebotGalleryPreview;

  if (!current) {
    return;
  }

  crossfade(async () => {
    if (on) {
      removeStylesheet(PREVIEW_KEY);
      await applyOwnStyles();
    } else {
      await applyPreview(current.preview);
    }
  });
};

/**
 * Shows a gallery style in place of the page's own styles, with controls to
 * install it, cancel, or hold to compare. Crossfades to it unless the page
 * is only now loading.
 */
export const showGalleryPreview = async (
  preview: GalleryPreview,
  { animate = true } = {}
): Promise<void> => {
  const current = shared.stylebotGalleryPreview;

  current?.unmount?.();
  shared.stylebotGalleryPreview = { preview };

  if (animate) {
    await crossfade(() => applyPreview(preview));
  } else {
    await applyPreview(preview);
  }

  const app = await load();

  if (shared.stylebotGalleryPreview?.preview !== preview) {
    return;
  }

  shared.stylebotGalleryPreview.unmount = app?.mount(preview.style, {
    install,
    cancel,
    compare,
  });
};

/**
 * Takes the preview and its controls off and puts the page's own styles back.
 */
export const hideGalleryPreview = async (): Promise<void> => {
  const current = shared.stylebotGalleryPreview;

  if (!current) {
    return;
  }

  shared.stylebotGalleryPreview = undefined;
  current.unmount?.();

  await crossfade(async () => {
    removeStylesheet(PREVIEW_KEY);
    await applyOwnStyles();
  });
};

/**
 * Shows the tab's preview again after it navigated within the style's site.
 * Only asks the background when some tab previews a style for this site.
 */
export const resumeGalleryPreview = async (): Promise<void> => {
  const items = await chrome.storage.local.get(GALLERY_PREVIEW_SITES_KEY);
  const sites: Array<string> = items[GALLERY_PREVIEW_SITES_KEY] ?? [];

  if (!sites.includes(toGallerySite(window.location.hostname))) {
    return;
  }

  const message: GetGalleryPreview = { name: 'GetGalleryPreview' };
  const { preview } = await chrome.runtime.sendMessage<
    GetGalleryPreview,
    GetGalleryPreviewResponse
  >(message);

  if (preview) {
    await showGalleryPreview(preview, { animate: false });
  }
};
