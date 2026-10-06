import type { ChatPageSignals } from '@stylebot/types';

import { isVisible, signatureOf } from './page-outline';
import { pageElements, pageIsDark } from './style-check/page';

// Alike siblings it takes to call a run of them a list worth compacting.
const MIN_LIST_ITEMS = 10;
const SIDEBAR_SELECTOR =
  'aside, [role="complementary"], [class*="sidebar" i], [id*="sidebar" i]';
// Ad slots by the names ad networks and sites commonly give them; looser
// matches like "ad-" catch words such as "head-" and "load-".
const AD_SELECTOR = [
  'ins.adsbygoogle',
  '[id^="google_ads"]',
  '[id*="advert" i]',
  '[class*="advert" i]',
  '[data-ad-slot]',
  '[data-ad-unit]',
  '[data-testid="ad-unit"]',
  '[aria-label="advertisement" i]',
  '[class*="sponsored" i]',
].join(', ');

const isPinned = (element: Element): boolean =>
  /^(fixed|sticky)$/.test(getComputedStyle(element).position);

/**
 * Whether a header stays on screen as the page scrolls: a fixed or sticky
 * bar across the top, not a full-screen overlay or the Stylebot panel.
 */
const hasPinnedHeader = (): boolean => {
  const width = window.innerWidth;
  const top = document.elementsFromPoint(width / 2, 4);

  return top.some(element => {
    if (element.closest('#stylebot')) {
      return false;
    }

    for (let node: Element | null = element; node; node = node.parentElement) {
      if (isPinned(node)) {
        const box = node.getBoundingClientRect();
        return (
          box.top <= 1 &&
          box.width >= width / 2 &&
          box.height <= window.innerHeight * 0.4
        );
      }
    }

    return false;
  });
};

/**
 * Whether a visible sidebar runs alongside the content: narrower than
 * 40% of the window and at least 200px tall.
 */
const hasSidebar = (): boolean =>
  Array.from(document.querySelectorAll(SIDEBAR_SELECTOR)).some(element => {
    if (element.closest('#stylebot') || !isVisible(element)) {
      return false;
    }

    const box = element.getBoundingClientRect();
    return (
      box.width >= 120 &&
      box.width <= window.innerWidth * 0.4 &&
      box.height >= 200
    );
  });

/**
 * Whether the page shows an ad big enough to be in the way, at least
 * 50px on each side.
 */
const hasAds = (): boolean =>
  Array.from(document.querySelectorAll(AD_SELECTOR)).some(element => {
    if (element.closest('#stylebot') || !isVisible(element)) {
      return false;
    }

    const box = element.getBoundingClientRect();
    return box.width >= 50 && box.height >= 50;
  });

/**
 * Whether the page holds a long run of alike items (stories, rows,
 * results), told apart the way the outline folds its repeats.
 */
const hasLongList = (): boolean =>
  pageElements(1, element => {
    if (element.children.length < MIN_LIST_ITEMS) {
      return false;
    }

    const counts = new Map<string, number>();

    return Array.from(element.children).some(child => {
      const signature = signatureOf(child);
      const count = (counts.get(signature) ?? 0) + 1;
      counts.set(signature, count);
      return count >= MIN_LIST_ITEMS && isVisible(child);
    });
  }).length > 0;

/**
 * Cheap facts about the page that say which requests suit it, for the
 * requests Chat suggests before a conversation starts.
 */
export const getPageSignals = (): ChatPageSignals => ({
  dark: pageIsDark() === true,
  list: hasLongList(),
  sidebar: hasSidebar(),
  pinnedHeader: hasPinnedHeader(),
  ads: hasAds(),
});
