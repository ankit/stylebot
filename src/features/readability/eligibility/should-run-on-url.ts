/**
 * A single short, barely-hyphenated path segment reads as a section/category
 * name (e.g. "tech", "news") rather than a full article slug.
 */
const looksLikeSectionPath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length !== 1) {
    return false;
  }

  const [segment] = segments;
  const hyphenCount = (segment.match(/-/g) || []).length;

  return segment.length < 20 && hyphenCount < 2;
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

  if (looksLikeSectionPath(window.location.pathname)) {
    return false;
  }

  if (blockedHosts.some(blockedHost => document.domain.endsWith(blockedHost))) {
    return false;
  }

  return true;
};
