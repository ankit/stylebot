import { queryWithShadowRoots } from '@stylebot/stylesheets';
import type { ElementFrame } from '@stylebot/types';

type ScrollPosition = { scroller: Element; left: number; top: number };

let scrolledFrom: Array<ScrollPosition> = [];

/**
 * The elements that can scroll el into view: its ancestors, crossing shadow
 * boundaries, and the document.
 */
const getScrollers = (el: Element): Array<Element> => {
  const scrollers: Array<Element> = [];
  let node: Node | null = el.parentNode;

  while (node) {
    if (node instanceof ShadowRoot) {
      node = node.host;
    } else if (node instanceof Element) {
      scrollers.push(node);
      node = node.parentNode;
    } else {
      break;
    }
  }

  if (
    document.scrollingElement &&
    !scrollers.includes(document.scrollingElement)
  ) {
    scrollers.push(document.scrollingElement);
  }

  return scrollers;
};

const isInViewport = (rect: DOMRect): boolean =>
  rect.top >= 0 &&
  rect.left >= 0 &&
  rect.bottom <= innerHeight &&
  rect.right <= innerWidth;

/**
 * Finds a selector's first visible match for a screenshot, scrolling it into
 * view when it isn't wholly in it, and remembers where everything was scrolled
 * for restoreScroll.
 */
export const frameElement = (selector: string): ElementFrame => {
  const target = queryWithShadowRoots<HTMLElement>(selector).find(el =>
    el.checkVisibility()
  );

  if (!target) {
    throw new Error(`No visible element matches ${selector}`);
  }

  let rect = target.getBoundingClientRect();
  const scrolled = !isInViewport(rect);

  if (scrolled) {
    scrolledFrom = getScrollers(target).map(scroller => ({
      scroller,
      left: scroller.scrollLeft,
      top: scroller.scrollTop,
    }));
    // An element taller or wider than the viewport shows from its start.
    target.scrollIntoView({
      behavior: 'instant',
      block: rect.height > innerHeight ? 'start' : 'center',
      inline: rect.width > innerWidth ? 'start' : 'center',
    });
    rect = target.getBoundingClientRect();
  }

  return {
    rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
    scrolled,
  };
};

/**
 * Scrolls back to where the page was before frameElement scrolled it.
 */
export const restoreScroll = (): void => {
  for (const { scroller, left, top } of scrolledFrom) {
    if (scroller.scrollLeft !== left || scroller.scrollTop !== top) {
      scroller.scrollTo({ left, top, behavior: 'instant' });
    }
  }

  scrolledFrom = [];
};
