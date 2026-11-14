const TEST_ID =
  '[data-testid], [data-test-id], [data-test], [data-cy], [data-qa]';

const WRAPPER_TAGS = new Set(['DIV', 'SPAN']);

// Room for a wrapper's own margin, like the 2px focus ring around X's avatar links.
const WRAPPER_SLACK = 4;

/**
 * The parent to climb to, stepping out of a shadow tree onto its host.
 */
export const getParentElement = (el: HTMLElement): HTMLElement | null => {
  if (el.parentElement) {
    return el.parentElement;
  }

  const root = el.getRootNode();

  return root instanceof ShadowRoot ? (root.host as HTMLElement) : null;
};

/**
 * Whether `outer` holds `inner` with at most a few pixels to spare per side.
 */
export const wraps = (outer: DOMRect, inner: DOMRect): boolean =>
  [
    inner.left - outer.left,
    inner.top - outer.top,
    outer.right - inner.right,
    outer.bottom - inner.bottom,
  ].every(gap => gap > -1 && gap <= WRAPPER_SLACK);

/**
 * The nearest link, button or other named element that a plain div or span
 * without a test id fills, give or take a few pixels, like the avatar link
 * around the divs that draw an avatar; else `el` itself.
 */
export const snapPastWrappers = (el: HTMLElement): HTMLElement => {
  if (!WRAPPER_TAGS.has(el.tagName) || el.matches(TEST_ID)) {
    return el;
  }

  const box = el.getBoundingClientRect();

  for (let parent = getParentElement(el); parent; ) {
    const fills = wraps(parent.getBoundingClientRect(), box);

    if (parent === document.body || !fills) {
      return el;
    }

    if (!WRAPPER_TAGS.has(parent.tagName)) {
      return parent;
    }

    parent = getParentElement(parent);
  }

  return el;
};

/**
 * The elements from `el` up to, but not including, its ancestor `ancestor`,
 * innermost first.
 */
export const getPathUpTo = (
  el: HTMLElement,
  ancestor: HTMLElement
): Array<HTMLElement> => {
  const path: Array<HTMLElement> = [];

  for (let node: HTMLElement | null = el; node && node !== ancestor; ) {
    path.push(node);
    node = getParentElement(node);
  }

  return path;
};
