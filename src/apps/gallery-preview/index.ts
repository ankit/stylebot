/**
 * The controls a page shows while it previews a gallery style. Loaded only
 * then, by the page's Stylebot script.
 */
import Vue from 'vue';
import type {
  GalleryPreviewHandlers,
  GalleryPreviewAppWindow,
} from '@stylebot/gallery';
import { t } from '@stylebot/i18n';
import { injectFontFaces } from '@stylebot/utils';
import type { GalleryStyle, StylebotAppearance } from '@stylebot/types';

import GalleryPreview from './components/GalleryPreview.vue';

// Inline and important on the host, so no page or preview rule can move it.
const HOST_CSS = `
  all: initial !important;
  position: fixed !important;
  inset: auto 0 20px 0 !important;
  z-index: 2147483647 !important;
  display: flex !important;
  justify-content: center !important;
  margin: 0 !important;
  padding: 0 20px !important;
  border: 0 !important;
  background: none !important;
  transform: none !important;
  filter: none !important;
  opacity: 1 !important;
  visibility: visible !important;
  direction: ltr !important;
  writing-mode: horizontal-tb !important;
  pointer-events: none !important;
  view-transition-name: stylebot-gallery-preview !important;
`;

let css: Promise<string> | null = null;

// Controls still confirming an install, taken away if another preview starts.
let leaving: (() => void) | null = null;

/**
 * The stylesheet, fetched once; a failed fetch is tried again next time.
 */
const getCss = (): Promise<string> => {
  if (!css) {
    css = fetch(chrome.runtime.getURL('gallery-preview/index.css'))
      .then(response => response.text())
      .catch((e: unknown) => {
        css = null;
        throw e;
      });
  }

  return css;
};

const getAppearance = async (): Promise<StylebotAppearance> => {
  const { options } = await chrome.storage.local.get('options');
  return options?.appearance ?? 'system';
};

/**
 * Mounts the preview's controls in a closed shadow root at the bottom of the
 * page, and returns a function that takes them away, or, once the style is
 * installed, leaves them to confirm it and go by themselves.
 */
const mount = (
  style: GalleryStyle,
  handlers: GalleryPreviewHandlers
): ((installed?: boolean) => void) => {
  const host = document.createElement('stylebot-gallery-preview');
  const root = host.attachShadow({ mode: 'closed' });
  const state = Vue.observable({ installed: false });
  let app: Vue | null = null;
  let removed = false;

  const remove = () => {
    if (leaving === remove) {
      leaving = null;
    }

    app?.$destroy();
    host.remove();
  };

  leaving?.();

  host.style.cssText = HOST_CSS;
  host.lang = t('language_code');
  document.documentElement.append(host);
  injectFontFaces().catch(() => undefined);

  Promise.all([getCss(), getAppearance()]).then(([text, appearance]) => {
    if (removed) {
      return;
    }

    const sheet = document.createElement('style');
    const el = document.createElement('div');

    sheet.textContent = text;
    root.append(sheet, el);

    app = new Vue({
      el,
      render: h =>
        h(GalleryPreview, {
          props: {
            styleData: style,
            handlers,
            appearance,
            installed: state.installed,
          },
          on: { done: remove },
        }),
    });
  });

  return installed => {
    removed = true;

    if (installed && app) {
      leaving = remove;
      state.installed = true;
    } else {
      remove();
    }
  };
};

Vue.mixin({ methods: { t } });

(window as GalleryPreviewAppWindow).stylebotGalleryPreviewApp = { mount };
