import { Readability } from '@mozilla/readability';

import { ReadabilityArticle } from '@stylebot/types';

export const getDomainUrlAndSource = (): { url: string; source: string } => {
  const parts = window.location.href.split('/');
  return { url: `${parts[0]}//${parts[2]}`, source: parts[2] };
};

/**
 * Parse a clone of the live document — Readability mutates whatever it's
 * given (strips scripts/styles etc.), so the original document must stay
 * intact until reader mode is confirmed to apply.
 */
export const getReadabilityArticle = async (): Promise<ReadabilityArticle> => {
  const doc = document.cloneNode(true) as Document;
  const article = new Readability(doc).parse();

  if (!article || !article.content) {
    throw new Error('Readability failed to parse the page');
  }

  return {
    title: article.title ?? '',
    byline: article.byline ?? '',
    content: article.content,
    siteName: article.siteName ?? '',
  };
};
