/*
 * Adapted from @mozilla/readability's Readability-readerable.js.
 * Copyright (c) 2010 Arc90 Inc.
 * Licensed under the Apache License, Version 2.0:
 * http://www.apache.org/licenses/LICENSE-2.0
 */

// NOTE: kept in sync with Mozilla's own copy — see their comment on this
// duplication in Readability-readerable.js.
const UNLIKELY_CANDIDATES =
  /-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i;
const OK_MAYBE_ITS_A_CANDIDATE = /and|article|body|column|content|main|shadow/i;

// Have to null-check style/className for SVG and MathML nodes.
const isNodeVisible = (node: Element): boolean =>
  (!(node as HTMLElement).style || (node as HTMLElement).style.display !== 'none') &&
  !node.hasAttribute('hidden') &&
  (!node.hasAttribute('aria-hidden') ||
    node.getAttribute('aria-hidden') !== 'true' ||
    // Wikimedia math images rely on a visible "fallback-image" node.
    !!node.className?.includes?.('fallback-image'));

export type IsProbablyReaderableOptions = {
  minScore?: number;
  minContentLength?: number;
  visibilityChecker?: (node: Element) => boolean;
};

// Decides whether a document is reader-able without parsing the whole thing.
export const isProbablyReaderable = (
  doc: Document,
  options: IsProbablyReaderableOptions = {}
): boolean => {
  const {
    minScore = 20,
    minContentLength = 140,
    visibilityChecker = isNodeVisible,
  } = options;

  let nodes: Element[] = Array.from(doc.querySelectorAll('p, pre, article'));

  // Some articles' DOM looks like <div>Sentence<br><br>Sentence<br></div> —
  // fold in the parent <div> of any <br> so those still count.
  const brNodes = doc.querySelectorAll('div > br');
  if (brNodes.length) {
    const set = new Set(nodes);
    brNodes.forEach(node => {
      if (node.parentNode instanceof Element) {
        set.add(node.parentNode);
      }
    });
    nodes = Array.from(set);
  }

  let score = 0;

  return nodes.some(node => {
    if (!visibilityChecker(node)) {
      return false;
    }

    const matchString = `${node.className} ${node.id}`;
    if (
      UNLIKELY_CANDIDATES.test(matchString) &&
      !OK_MAYBE_ITS_A_CANDIDATE.test(matchString)
    ) {
      return false;
    }

    if (node.matches('li p')) {
      return false;
    }

    const textContentLength = (node.textContent ?? '').trim().length;
    if (textContentLength < minContentLength) {
      return false;
    }

    score += Math.sqrt(textContentLength - minContentLength);

    return score > minScore;
  });
};
