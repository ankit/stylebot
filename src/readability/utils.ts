import Defuddle from 'defuddle';

import { ReadabilityArticle } from '@stylebot/types';

export const getDomainUrlAndSource = (): { url: string; source: string } => {
  const parts = window.location.href.split('/');
  return { url: `${parts[0]}//${parts[2]}`, source: parts[2] };
};

/**
 * Parse a clone of the live document — Defuddle mutates whatever it's
 * given (strips scripts/styles etc.), so the original document must stay
 * intact until reader mode is confirmed to apply.
 */
export const getReadabilityArticle = async (): Promise<ReadabilityArticle> => {
  const doc = document.cloneNode(true) as Document;

  // The clone has no defaultView, so Defuddle's small-image filter can't read
  // rendered size and falls back to (often-wrong) static width/height attrs.
  const article = new Defuddle(doc, { removeSmallImages: false }).parse();

  if (!article || !article.content) {
    throw new Error('Defuddle failed to parse the page');
  }

  return {
    title: article.title ?? '',
    byline: article.author ?? '',
    content: article.content,
    siteName: article.site ?? '',
  };
};
