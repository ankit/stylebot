import Defuddle from 'defuddle';

import { ReadabilityArticle } from '@stylebot/types';

export const getDomainUrlAndSource = (): { url: string; source: string } => {
  const parts = window.location.href.split('/');
  return { url: `${parts[0]}//${parts[2]}`, source: parts[2] };
};

// Sites serve the same photo under multiple resized-variant URLs, so compare
// directory + filename-prefix instead of raw URLs.
const imageIdentity = (url: string): { directory: string; stem: string } => {
  const withoutQuery = url.split('?')[0];
  const lastSlash = withoutQuery.lastIndexOf('/');

  return {
    directory: withoutQuery.slice(0, lastSlash),
    stem: withoutQuery.slice(lastSlash + 1).replace(/\.[a-z0-9]+$/i, '').toLowerCase(),
  };
};

// A shared directory alone isn't enough (WordPress groups a month's uploads
// together), so also require a shared filename prefix.
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

// The hero image is often resolved in metadata but missing from `content`;
// build the tag via the DOM so the URL is safely escaped.
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

// Ad-slot labels (e.g. NYT's "Advertisement" / "SKIP ADVERTISEMENT") that sit
// inline in the article flow and read as real content to Defuddle.
const AD_MARKER_PATTERN = /^(advertisement|skip advertisement)$/i;

const removeAdMarkers = (doc: Document): void => {
  doc.querySelectorAll('p, div, span, a, h1, h2, h3, h4, h5, h6').forEach(el => {
    if (el.children.length === 0 && AD_MARKER_PATTERN.test(normalizeText(el.textContent || ''))) {
      el.remove();
    }
  });
};

// Defuddle's hero-block cleanup can drop a real subheadline as empty chrome;
// article.description survives that removal, so recover it here.
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

// Parse a clone — Defuddle mutates whatever it's given, so the original
// document must stay intact until reader mode is confirmed to apply.
export const getReadabilityArticle = async (): Promise<ReadabilityArticle> => {
  const doc = document.cloneNode(true) as Document;

  removeAdMarkers(doc);

  // The clone has no defaultView, so Defuddle's small-image filter can't
  // measure rendered size — copy naturalWidth/Height from the live images.
  const liveImages = document.images;
  const clonedImages = doc.images;

  for (let i = 0; i < clonedImages.length; i++) {
    const live = liveImages[i];

    if (live && live.naturalWidth > 0 && live.naturalHeight > 0) {
      clonedImages[i].setAttribute('width', String(live.naturalWidth));
      clonedImages[i].setAttribute('height', String(live.naturalHeight));
    }
  }

  const article = new Defuddle(doc).parse();

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
