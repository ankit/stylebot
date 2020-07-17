import Vue from 'vue';
import App from './App.vue';
import Readability from 'readability';

/* @ts-ignore */
import { isProbablyReaderable } from '../../node_modules/readability/Readability-readerable';

declare global {
  interface Window {
    stylebotReaderUrl: string;
    stylebotReaderOriginalDocumentBodyElements: Array<Node>;
  }
}

type Article = {
  title: string;
  byline: string;
  content: string;
  siteName: string;
};

const getDomainUrl = (): string => {
  const parts = window.location.href.split('/');
  return `${parts[0]}//${parts[2]}`;
};

/**
 * Fetch document object and apply readability
 *
 * Fetching url via XHR since document response is different v/s document loaded in browser.
 * same as https://dxr.mozilla.org/mozilla-central/source/toolkit/components/reader/ReaderMode.jsm#261
 */
const getReadabilityArticle = async (): Promise<Article> => {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', window.location.href, true);
    xhr.responseType = 'document';

    xhr.onload = evt => {
      if (xhr.status !== 200) {
        reject();
        return;
      }

      let doc = xhr.responseXML;
      if (!doc) {
        reject();
        return;
      }

      try {
        const article = new Readability(doc).parse();

        if (article.content) {
          resolve(article);
          return;
        }

        reject();
      } catch (e) {
        reject();
      }
    };

    xhr.send();
  });
};

/**
 * Fetch CSS and attach it to shadow dom for stylebot reader.
 */
const initCss = async (root: ShadowRoot): Promise<void> => {
  const cssUrl = chrome.extension.getURL('readability/index.css');

  return new Promise((resolve, reject) => {
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

/**
 * Init shadow DOM for stylebot reader.
 */
const initShadowDOM = async () => {
  const host = document.createElement('div');
  const hostStyle =
    'top: 0; height: 100%; width: 100%; position: fixed; z-index: 10000;';

  host.id = 'stylebot-reader';
  host.setAttribute('style', hostStyle);
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open', delegatesFocus: true });
  const app = document.createElement('div');

  app.id = 'stylebot-reader-app';
  shadowRoot.appendChild(app);

  await initCss(shadowRoot);
  return app;
};

const initReaderApp = async (url: string, article: Article) => {
  const el = await initShadowDOM();

  new Vue({
    el,

    render: createElement => {
      const context = {
        props: { url, article },
      };

      return createElement(App, context);
    },
  });
};

/**
 * Hide document content until reader is ready
 * todo: optimize performance and UX when loading stylebot reader
 * currently, sometimes the page flashes for the reader content is loaded.
 * or a white screen appears for a prolonged period, especially for slower websites.
 */
const applyLoaderCss = () => {
  const style = document.createElement('style');

  style.type = 'text/css';
  style.setAttribute('id', 'stylebot-reader-loading');
  style.appendChild(
    document.createTextNode('body *:not(#stylebot) { display: none; }')
  );

  document.documentElement.appendChild(style);
};

const initReadability = async () => {
  return new Promise(async resolve => {
    if (isProbablyReaderable(document)) {
      try {
        const url = getDomainUrl();
        const article = await getReadabilityArticle();

        cacheDocumentBody();
        initReaderApp(url, article);
        resolve();
      } catch (e) {
        resolve();
      }
    } else {
      resolve();
    }
  });
};

const revertToCachedDocumentBody = (): void => {
  if (window.stylebotReaderOriginalDocumentBodyElements) {
    window.stylebotReaderOriginalDocumentBodyElements.forEach(node => {
      document.body.appendChild(node);
    });
  }
};

const cacheDocumentBody = (): void => {
  const nodes = Array.prototype.slice
    .call(document.body.childNodes)
    .filter(node => node.id !== 'stylebot');

  window.stylebotReaderOriginalDocumentBodyElements = nodes;
  nodes.forEach(node => node.remove());
};

const cacheCurrentUrl = (): void => {
  window.stylebotReaderUrl = window.location.href;
};

const didUrlChange = (): boolean => {
  return window.stylebotReaderUrl !== window.location.href;
};

/**
 * Check if stylebot reader is applicable for current url
 * Same as https://dxr.mozilla.org/mozilla-central/source/toolkit/components/reader/Readerable.js#60
 */
const shouldCheckUri = (): boolean => {
  const blockedHosts = [
    'amazon.com',
    'github.com',
    'mail.google.com',
    'pinterest.com',
    'reddit.com',
    'twitter.com',
    'youtube.com',
  ];

  if (!['http:', 'https:'].includes(window.location.protocol)) {
    return false;
  }

  if (window.location.pathname === '/') {
    return false;
  }

  if (blockedHosts.some(blockedHost => document.domain.endsWith(blockedHost))) {
    return false;
  }

  return true;
};

export const apply = async (forceApply = false) => {
  if (window !== window.top) {
    return;
  }

  // Prevent duplicate calls for the same url if not force applying
  if (!forceApply && !didUrlChange()) {
    return;
  }
  cacheCurrentUrl();

  // Remove any existing instance of stylebot reader
  remove();

  if (!shouldCheckUri()) {
    return;
  }

  applyLoaderCss();
  if (document.readyState === 'complete') {
    await initReadability();
  } else {
    document.addEventListener('DOMContentLoaded', async () => {
      await initReadability();
    });
  }
};

export const remove = () => {
  revertToCachedDocumentBody();
  document.getElementById('stylebot-reader')?.remove();
};
