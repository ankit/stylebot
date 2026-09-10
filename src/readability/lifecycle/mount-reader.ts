import Vue from 'vue';
import { t } from '@stylebot/i18n';
import { hasReaderableContent } from '../eligibility/has-readerable-content';

import App from '../components/App.vue';
import { getDomainUrlAndSource } from './get-domain-url-and-source';
import { getReadabilityArticle } from './get-readability-article';

import { ReadabilityArticle } from '@stylebot/types';
import { cacheDocument } from './document-cache';

Vue.mixin({
  methods: {
    t,
  },
});

/**
 * Fetches the reader's compiled stylesheet and injects it into the shadow root.
 */
const initCss = async (root: ShadowRoot): Promise<void> => {
  const cssUrl = chrome.runtime.getURL('readability/index.css');

  return new Promise((resolve, reject) => {
    fetch(cssUrl, { method: 'GET' })
      .then(response => response.text())
      .then(css => {
        const el = document.createElement('style');
        el.setAttribute('id', 'stylebot-reader');
        el.innerHTML = css;
        root.appendChild(el);
        resolve();
      })
      .catch(reject);
  });
};

/**
 * Creates the shadow DOM host the reader app mounts into, isolated from page styles.
 */
const initShadowDOM = async (): Promise<HTMLElement> => {
  const host = document.createElement('div');
  const hostStyle =
    'top: 0; height: 100%; width: 100%; position: fixed; z-index: 10000;';

  host.id = 'stylebot-reader';
  host.setAttribute('style', hostStyle);
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const app = document.createElement('div');

  app.id = 'stylebot-reader-app';
  shadowRoot.appendChild(app);

  await initCss(shadowRoot);
  return app;
};

/**
 * Instantiates the reader's Vue app inside the shadow DOM host.
 */
const initVueApp = async (
  url: string,
  source: string,
  article: ReadabilityArticle
) => {
  const el = await initShadowDOM();

  new Vue({
    el,
    render: createElement => {
      const context = {
        props: { url, source, article },
      };

      return createElement(App, context);
    },
  });
};

/**
 * Parses the current page into an article and mounts the reader UI
 * into a shadow DOM host on top of it.
 */
export const mountReader = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (!hasReaderableContent(document)) {
      reject();
      return;
    }

    try {
      const { url, source } = getDomainUrlAndSource();
      const article = await getReadabilityArticle();

      cacheDocument();
      await initVueApp(url, source, article);
      resolve();
    } catch (e) {
      reject();
    }
  });
};
