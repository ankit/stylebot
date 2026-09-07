import Defuddle from 'defuddle';

import { ReadabilityArticle } from '@stylebot/types';

export const getDomainUrlAndSource = (): { url: string; source: string } => {
  const parts = window.location.href.split('/');
  return { url: `${parts[0]}//${parts[2]}`, source: parts[2] };
};

// Sites often serve the same photo under multiple resized-variant URLs (a
// different filename suffix, e.g. NYT's "-facebookJumbo" vs
// "-mobileMasterAt3x", or a different resize query param) — comparing raw
// URLs misses these, so compare directory + filename-prefix instead.
const imageIdentity = (url: string): { directory: string; stem: string } => {
  const withoutQuery = url.split('?')[0];
  const lastSlash = withoutQuery.lastIndexOf('/');

  return {
    directory: withoutQuery.slice(0, lastSlash),
    stem: withoutQuery.slice(lastSlash + 1).replace(/\.[a-z0-9]+$/i, '').toLowerCase(),
  };
};

// A shared directory alone isn't enough — WordPress groups a whole month's
// unrelated uploads under one directory — so also require the filenames to
// share a meaningful prefix (the part before a size/variant suffix).
const isSameImage = (a: string, b: string): boolean => {
  const idA = imageIdentity(a);
  const idB = imageIdentity(b);

  if (idA.directory !== idB.directory) {
    return false;
  }

  let sharedPrefixLength = 0;
  while (idA.stem[sharedPrefixLength] === idB.stem[sharedPrefixLength]) {
    sharedPrefixLength++;
  }

  return sharedPrefixLength >= Math.min(idA.stem.length, idB.stem.length) * 0.5;
};

// WordPress (and others) often render the hero image as a sibling of the
// content container Defuddle scopes to, so it's resolved in metadata but
// missing from `content` — build the tag via the DOM so the URL is safely
// escaped, rather than interpolating it into an HTML string.
const withLeadImage = (content: string, imageUrl?: string): string => {
  if (!imageUrl || !/^https?:\/\//.test(imageUrl)) {
    return content;
  }

  const existingSrcs = [...content.matchAll(/<img[^>]*\ssrc="([^"]*)"/g)].map(
    match => match[1]
  );

  if (existingSrcs.some(src => isSameImage(src, imageUrl))) {
    return content;
  }

  const figure = document.createElement('figure');
  const img = document.createElement('img');
  img.src = imageUrl;
  figure.appendChild(img);

  return `${figure.outerHTML}${content}`;
};

const normalizeText = (text: string): string => text.replace(/\s+/g, ' ').trim();

// Defuddle's own "hero header block" cleanup treats a title+time+dek wrapper
// as empty metadata chrome and deletes it whenever the dek reads as under 30
// words of "prose" — dropping real subheadline text along with it. Its
// article.description metadata survives that removal, so recover it here.
const withDescription = (content: string, description?: string): string => {
  if (!description) {
    return content;
  }

  const plainContent = normalizeText(content.replace(/<[^>]+>/g, ' '));

  if (plainContent.includes(normalizeText(description))) {
    return content;
  }

  const p = document.createElement('p');
  p.textContent = description;

  return `${p.outerHTML}${content}`;
};

/**
 * Parse a clone of the live document — Defuddle mutates whatever it's
 * given (strips scripts/styles etc.), so the original document must stay
 * intact until reader mode is confirmed to apply.
 */
export const getReadabilityArticle = async (): Promise<ReadabilityArticle> => {
  const doc = document.cloneNode(true) as Document;

  const article = new Defuddle(doc, {
    // The clone has no defaultView, so Defuddle's small-image filter can't
    // read rendered size and falls back to (often-wrong) width/height attrs.
    removeSmallImages: false,
  }).parse();

  if (!article || !article.content) {
    throw new Error('Defuddle failed to parse the page');
  }

  const content = withDescription(
    withLeadImage(article.content, article.image),
    article.description
  );

  return {
    title: article.title ?? '',
    byline: article.author ?? '',
    content,
    siteName: article.site ?? '',
    published: article.published ?? '',
  };
};
