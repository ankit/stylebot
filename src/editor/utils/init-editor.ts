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

const SELF_HOSTED_FONTS = [
  { family: 'Fira Code', file: 'fira-code', weights: [400, 500, 600] },
  { family: 'Geist', file: 'geist', weights: [400, 500, 600, 700] },
];

const fontFaceCss = (): string =>
  SELF_HOSTED_FONTS.flatMap(({ family, file, weights }) =>
    weights.map(
      weight => `
        @font-face {
          font-family: '${family}';
          font-style: normal;
          font-weight: ${weight};
          font-display: swap;
          src: url('${chrome.runtime.getURL(
            `fonts/${file}-${weight}.woff2`
          )}') format('woff2');
        }
      `
    )
  ).join('');

const injectCss = (shadowRoot: ShadowRoot): Promise<void> => {
  const url = chrome.runtime.getURL('editor/app.css');

  return fetch(url, { method: 'GET' })
    .then(response => response.text())
    .then(css => {
      const styleEl = document.createElement('style');
      styleEl.setAttribute('id', 'stylebot-editor-css');
      styleEl.innerHTML = fontFaceCss() + css;
      shadowRoot.appendChild(styleEl);
    });
};

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

  document.body.appendChild(stylebotAppHost);

  const shadowRoot = stylebotAppHost.attachShadow({ mode: 'open' });
  const stylebotApp = document.createElement('div');

  stylebotApp.id = 'stylebot-app';
  shadowRoot.appendChild(stylebotApp);

  // Wait for the stylesheet to land before mounting — otherwise Vue's
  // synchronous mount renders the unstyled markup first, causing a
  // visible flash whenever the CSS fetch is slower than the mount.
  injectCss(shadowRoot).then(() => mountEditor(store, stylebotApp));
};

export { initEditor, mountEditor };
