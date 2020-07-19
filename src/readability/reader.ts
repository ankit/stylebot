import Vue from 'vue';
/* @ts-ignore */
import { isProbablyReaderable } from '../../node_modules/readability/Readability-readerable';

import App from './App.vue';
import { getDomainUrlAndLabel, getReadabilityArticle } from './utils';

import { ReadabilityArticle } from '@stylebot/types';
import { cacheDocument } from './cache';

const initCss = async (root: ShadowRoot): Promise<void> => {
  const cssUrl = chrome.extension.getURL('readability/index.css');

  return new Promise(resolve => {
    fetch(cssUrl, { method: 'GET' })
      .then(response => response.text())
      .then(css => {
        const el = document.createElement('style');
        el.setAttribute('id', 'stylebot-reader');
        el.innerHTML = css;
        root.appendChild(el);
        resolve();
      });
  });
};

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

const initVueApp = async (
  url: string,
  urlLabel: string,
  article: ReadabilityArticle
) => {
  const el = await initShadowDOM();

  new Vue({
    el,

    render: createElement => {
      const context = {
        props: { url, urlLabel, article },
      };

      return createElement(App, context);
    },
  });
};

export const initReader = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (!isProbablyReaderable(document)) {
      reject();
    }

    try {
      const { url, urlLabel } = getDomainUrlAndLabel();
      const article = await getReadabilityArticle();

      cacheDocument();
      initVueApp(url, urlLabel, article);
      resolve();
    } catch (e) {
      reject();
    }
  });
};
