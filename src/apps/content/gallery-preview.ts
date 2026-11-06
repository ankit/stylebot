import {
  GALLERY_PREVIEW_SITES_KEY,
  getPreviewPageOptions,
  toGallerySite,
  type GalleryPreviewAppWindow,
  type GalleryPreviewControls,
} from '@stylebot/gallery';
import {
  injectStylesheet,
  removeStylesheet,
  setStyleOptions,
} from '@stylebot/stylesheets';
import type {
  EndGalleryPreview,
  GalleryPreview,
  GalleryStyle,
  GetGalleryPreview,
  GetGalleryPreviewResponse,
  GetGallerySuggestions,
  GetGallerySuggestionsResponse,
  InstallGalleryPreview,
  InstallGalleryPreviewResponse,
  PreviewGalleryStyle,
  PreviewGalleryStyleResponse,
  SetGalleryPreviewOption,
  UndoGalleryInstall,
  UndoGalleryInstallResponse,
} from '@stylebot/types';

import { applyPageState, getPageState } from './page-state';
import { getCompiledStyles } from './saved-styles';

// Keyed like a saved style's url, but no saved style can have it.
const PREVIEW_KEY = 'stylebot:gallery-preview';

// Shared by Stylebot's scripts on the page, which each bundle this module.
type PreviewWindow = GalleryPreviewAppWindow & {
  stylebotGalleryPreview?: {
    preview: GalleryPreview;
    replacedUrls: Array<string>;
    controls?: GalleryPreviewControls;
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

/**
 * Shows a gallery style in place of the saved styles it replaces, keeping the
 * page's others, and with the values picked for the options it declares.
 */
const applyPreview = (
  preview: GalleryPreview,
  replacedUrls: Array<string>
): void => {
  replacedUrls.forEach(url => removeStylesheet(url));
  setStyleOptions(getPreviewPageOptions(preview));
  injectStylesheet(PREVIEW_KEY, preview.css, preview.importUrls);
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
    ready: Promise<void>;
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

  const transition = doc.startViewTransition(update);

  // Rejects when a quick next change skips this crossfade.
  transition.ready.catch(() => undefined);
  await transition.updateCallbackDone;
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

const undo = (): Promise<UndoGalleryInstallResponse> => {
  const message: UndoGalleryInstall = { name: 'UndoGalleryInstall' };

  return chrome.runtime.sendMessage<
    UndoGalleryInstall,
    UndoGalleryInstallResponse
  >(message);
};

const cancel = (): void => {
  const message: EndGalleryPreview = { name: 'EndGalleryPreview' };
  chrome.runtime.sendMessage(message);
};

const setOption = (option: string, value: string): void => {
  const current = shared.stylebotGalleryPreview;

  if (!current) {
    return;
  }

  const preview: GalleryPreview = {
    ...current.preview,
    values: { ...current.preview.values, [option]: value },
  };

  current.preview = preview;
  crossfade(async () => setStyleOptions(getPreviewPageOptions(preview)));

  const message: SetGalleryPreviewOption = {
    name: 'SetGalleryPreviewOption',
    option,
    value,
  };
  chrome.runtime.sendMessage(message);
};

/**
 * The gallery's styles for the page's site, for moving between them.
 */
const getSiteStyles = async (): Promise<Array<GalleryStyle>> => {
  const message: GetGallerySuggestions = {
    name: 'GetGallerySuggestions',
    pageUrl: window.location.href,
    incognito: chrome.extension.inIncognitoContext,
  };
  const response = await chrome.runtime.sendMessage<
    GetGallerySuggestions,
    GetGallerySuggestionsResponse
  >(message);

  return response.ok ? response.styles : [];
};

const previewStyle = (id: number): Promise<PreviewGalleryStyleResponse> => {
  const message: PreviewGalleryStyle = { name: 'PreviewGalleryStyle', id };

  return chrome.runtime.sendMessage<
    PreviewGalleryStyle,
    PreviewGalleryStyleResponse
  >(message);
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
      applyPreview(current.preview, current.replacedUrls);
    }
  });
};

/**
 * Shows a gallery style in place of the page's own styles, with controls to
 * install it, cancel, or compare, moving the controls already on the page
 * across. Crossfades to it unless the page is only now loading.
 */
export const showGalleryPreview = async (
  preview: GalleryPreview,
  replacedUrls: Array<string>,
  { animate = true } = {}
): Promise<void> => {
  const current = shared.stylebotGalleryPreview;

  const controls = current?.controls;

  shared.stylebotGalleryPreview = { preview, replacedUrls, controls };

  // An earlier preview may have replaced another style, so put them back first.
  const update = async () => {
    if (current) {
      removeStylesheet(PREVIEW_KEY);
      await applyOwnStyles();
    }

    applyPreview(preview, replacedUrls);
  };

  if (animate) {
    await crossfade(update);
  } else {
    await update();
  }

  if (shared.stylebotGalleryPreview?.preview !== preview) {
    return;
  }

  if (controls) {
    controls.show(preview);
    return;
  }

  const app = await load();

  if (shared.stylebotGalleryPreview?.preview !== preview) {
    return;
  }

  shared.stylebotGalleryPreview.controls = app?.mount(preview, {
    install,
    undo,
    cancel,
    compare,
    setOption,
    getSiteStyles,
    preview: previewStyle,
  });
};

/**
 * Takes the preview and its controls off and puts the page's own styles back.
 * Once installed, the controls confirm it, with an undo, before they go.
 */
export const hideGalleryPreview = async (installed = false): Promise<void> => {
  const current = shared.stylebotGalleryPreview;

  if (!current) {
    return;
  }

  shared.stylebotGalleryPreview = undefined;
  current.controls?.remove(installed);

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
  const { preview, replacedUrls } = await chrome.runtime.sendMessage<
    GetGalleryPreview,
    GetGalleryPreviewResponse
  >(message);

  if (preview && replacedUrls) {
    await showGalleryPreview(preview, replacedUrls, { animate: false });
  }
};
