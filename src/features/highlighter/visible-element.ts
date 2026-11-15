type Ignore = (node: Element) => boolean;

/**
 * Whether the element's own border box, leaving out its pseudo-elements,
 * holds the point.
 */
const isPointInBox = (el: Element, x: number, y: number): boolean => {
  const box = el.getBoundingClientRect();

  return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
};

/**
 * Whether the element draws a positioned ::before or ::after, which can lie
 * on top of its own children or stretch past its own box.
 */
const hasPositionedPseudoElement = (el: Element): boolean =>
  ['::before', '::after'].some(pseudo => {
    const style = getComputedStyle(el, pseudo);

    return (
      style.content !== 'none' &&
      (style.position === 'absolute' || style.position === 'fixed')
    );
  });

/**
 * The topmost element under an element's positioned ::before or ::after,
 * like a link's overlay across a whole story card, whose own box holds the
 * point: kept to the element's children while the point is inside it.
 */
const getElementUnderOverlay = (
  el: HTMLElement,
  x: number,
  y: number,
  ignore: Ignore
): HTMLElement => {
  const inside = isPointInBox(el, x, y);

  if (inside && !el.firstElementChild) {
    return el;
  }

  const root = el.getRootNode() as Document | ShadowRoot;
  const under = root
    .elementsFromPoint(x, y)
    .find(
      node =>
        node !== el &&
        (!inside || el.contains(node)) &&
        !ignore(node) &&
        isPointInBox(node, x, y)
    );

  return (under as HTMLElement | undefined) ?? el;
};

/**
 * The first visible element under a fully transparent one, like the
 * invisible checkbox over a menu button.
 */
const getElementUnderTransparent = (
  el: HTMLElement,
  x: number,
  y: number,
  ignore: Ignore
): HTMLElement => {
  if (el.checkVisibility({ opacityProperty: true })) {
    return el;
  }

  const root = el.getRootNode() as Document | ShadowRoot;
  const visible = root.elementsFromPoint(x, y).find(
    node =>
      !ignore(node) &&
      node.checkVisibility({
        opacityProperty: true,
        visibilityProperty: true,
      })
  );

  return (visible as HTMLElement | undefined) ?? el;
};

/**
 * Whether what the pointer shows over the element can be something else:
 * it's fully transparent, or draws a ::before or ::after that may cover it.
 */
export const canCoverOthers = (el: HTMLElement): boolean =>
  !el.checkVisibility({ opacityProperty: true }) ||
  hasPositionedPseudoElement(el);

/**
 * What the pointer shows at a point where it hit `el`, looking through a
 * positioned ::before or ::after and fully transparent elements on top.
 */
export const getVisibleElementAt = (
  el: HTMLElement,
  x: number,
  y: number,
  ignore: Ignore = () => false
): HTMLElement => {
  const uncovered = hasPositionedPseudoElement(el)
    ? getElementUnderOverlay(el, x, y, ignore)
    : el;

  return getElementUnderTransparent(uncovered, x, y, ignore);
};
