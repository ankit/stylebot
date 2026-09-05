import Readability from 'readability';

/* @ts-ignore */
import { isProbablyReaderable } from '../../node_modules/readability/Readability-readerable';

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

export const isReaderable = (): boolean => {
  // Once mounted, the original content is stripped and the article lives
  // in a shadow root `querySelectorAll` can't see — short-circuit instead.
  if (document.getElementById('stylebot-reader')) {
    return true;
  }

  return shouldRunOnUrl() && isProbablyReaderable(document);
};

/**
 * Parse a clone of the live document — Readability mutates whatever it's
 * given (strips scripts/styles etc.), so the original document must stay
 * intact until reader mode is confirmed to apply.
 */
export const getReadabilityArticle = async (): Promise<ReadabilityArticle> => {
  const doc = document.cloneNode(true) as Document;
  const article = new Readability(doc).parse();

  if (!article?.content) {
    throw new Error('Readability failed to parse the page');
  }

  return article;
};
