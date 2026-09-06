import Defuddle from 'defuddle';

import { ReadabilityArticle } from '@stylebot/types';

export const getDomainUrlAndSource = (): { url: string; source: string } => {
  const parts = window.location.href.split('/');
  return { url: `${parts[0]}//${parts[2]}`, source: parts[2] };
};

// WordPress (and others) often render the hero image as a sibling of the
// content container Defuddle scopes to, so it's resolved in metadata but
// missing from `content` — build the tag via the DOM so the URL is safely
// escaped, rather than interpolating it into an HTML string.
const withLeadImage = (content: string, imageUrl?: string): string => {
  if (!imageUrl || !/^https?:\/\//.test(imageUrl) || content.includes(imageUrl)) {
    return content;
  }

  const figure = document.createElement('figure');
  const img = document.createElement('img');
  img.src = imageUrl;
  figure.appendChild(img);

  return `${figure.outerHTML}${content}`;
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
    content: withLeadImage(article.content, article.image),
    siteName: article.site ?? '',
  };
};
