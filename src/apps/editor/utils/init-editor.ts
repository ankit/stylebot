import Vue from 'vue';
import type { Store } from 'vuex';
import { t } from '@stylebot/i18n';

import type { State } from '../store';
import TheStylebotApp from '../components/TheStylebotApp.vue';

import '../index.scss';

let vueReady = false;

/**
 * Registers the globals every editor host needs before mounting.
 */
const setupVue = (): void => {
  if (vueReady) {
    return;
  }
  vueReady = true;

  Vue.mixin({
    methods: {
      t,
    },
  });
};

/**
 * Mounts the editor app with its store onto an element.
 */
const mountEditor = (store: Store<State>, el: Element): Vue => {
  setupVue();

  return new Vue({
    store,
    el,
    render: h => h(TheStylebotApp),
  });
};

/**
 * Registers the editor's fonts on the page's document, since browsers
 * ignore font-face rules inside a shadow root. Reads the same fonts.css the
 * extension pages use, pointing its files at the extension.
 */
const injectFontFaces = async (): Promise<void> => {
  if (document.getElementById('stylebot-editor-fonts')) {
    return;
  }

  const styleEl = document.createElement('style');
  styleEl.setAttribute('id', 'stylebot-editor-fonts');
  (document.head || document.documentElement).appendChild(styleEl);

  const css = await fetch(chrome.runtime.getURL('fonts/fonts.css')).then(
    response => response.text()
  );

  styleEl.textContent = css.replace(
    /url\('([^']+)'\)/g,
    (_, file: string) => `url('${chrome.runtime.getURL(`fonts/${file}`)}')`
  );
};

let editorCss: Promise<string> | null = null;

/**
 * Starts fetching the editor's stylesheet, so opening the editor doesn't
 * wait on it. A failed fetch is forgotten, so the next open tries again.
 */
const preloadEditorCss = (): Promise<string> => {
  if (!editorCss) {
    const url = chrome.runtime.getURL('editor/app.css');

    editorCss = fetch(url, { method: 'GET' })
      .then(response => response.text())
      .catch((e: unknown) => {
        editorCss = null;
        throw e;
      });
  }

  return editorCss;
};

const injectCss = (shadowRoot: ShadowRoot): Promise<void> =>
  preloadEditorCss().then(css => {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('id', 'stylebot-editor-css');
    styleEl.innerHTML = css;
    shadowRoot.appendChild(styleEl);
  });

const initEditor = (store: Store<State>): void => {
  if (document.getElementById('stylebot')) {
    return;
  }

  const stylebotAppHost = document.createElement('div');
  stylebotAppHost.id = 'stylebot';

  // !important beats page rules that would hide this; fixed + max z-index
  // beats page content stacked above it. Sized 0x0, the panel is its own fixed element.
  const hostStyle = stylebotAppHost.style;
  hostStyle.setProperty('display', 'block', 'important');
  hostStyle.setProperty('position', 'fixed', 'important');
  hostStyle.setProperty('top', '0', 'important');
  hostStyle.setProperty('left', '0', 'important');
  hostStyle.setProperty('width', '0', 'important');
  hostStyle.setProperty('height', '0', 'important');
  hostStyle.setProperty('z-index', '2147483647', 'important');
  // direction/writing-mode inherit into the shadow tree; an RTL or vertical
  // page would otherwise flip the panel's flow and push it off-screen.
  hostStyle.setProperty('direction', 'ltr', 'important');
  hostStyle.setProperty('writing-mode', 'horizontal-tb', 'important');
  // So is the page's language, which would pick fonts and line breaks for the
  // panel; it takes Stylebot's own instead.
  stylebotAppHost.lang = t('language_code');

  document.body.appendChild(stylebotAppHost);

  const shadowRoot = stylebotAppHost.attachShadow({ mode: 'open' });
  const stylebotApp = document.createElement('div');

  stylebotApp.id = 'stylebot-app';
  shadowRoot.appendChild(stylebotApp);

  injectFontFaces().catch(() => {});

  // Wait for the stylesheet to land before mounting — otherwise Vue's
  // synchronous mount renders the unstyled markup first, causing a
  // visible flash whenever the CSS fetch is slower than the mount.
  injectCss(shadowRoot).then(() => mountEditor(store, stylebotApp));
};

export { initEditor, mountEditor, preloadEditorCss };
