import Readability from 'readability';
import { ReadabilityArticle } from '@stylebot/types';

export const getDomainUrlAndSource = (): { url: string; source: string } => {
  const parts = window.location.href.split('/');
  return { url: `${parts[0]}//${parts[2]}`, source: parts[2] };
};

/**
 * Check if reader is applicable for current url
 * Same as https://dxr.mozilla.org/mozilla-central/source/toolkit/components/reader/Readerable.js#60
 */
export const shouldRunOnUrl = (): boolean => {
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

/**
 * Fetch document object and apply readability
 *
 * Fetching url via XHR since document response is different v/s document loaded in browser.
 * same as https://dxr.mozilla.org/mozilla-central/source/toolkit/components/reader/ReaderMode.jsm#261
 */
export const getReadabilityArticle = async (): Promise<ReadabilityArticle> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', window.location.href, true);
    xhr.responseType = 'document';

    xhr.onload = () => {
      if (xhr.status !== 200) {
        reject();
        return;
      }

      const doc = xhr.responseXML;
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
