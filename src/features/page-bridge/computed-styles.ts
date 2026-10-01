/**
 * Calls back once the pointer leaves an element that's hovered now, so its
 * :hover rules can be read away. The editor's own ancestors stay hovered
 * while the pointer is over the panel, so they're skipped.
 */
const watchHoverEnd = (
  element: Element,
  onHoverEnd: () => void
): (() => void) | null => {
  if (
    !element.matches(':hover') ||
    element.contains(document.getElementById('stylebot'))
  ) {
    return null;
  }

  element.addEventListener('mouseleave', onHoverEnd, { once: true });
  return () => element.removeEventListener('mouseleave', onHoverEnd);
};

/**
 * Reads computed values for `element`, or else the first element a selector
 * matches, skipping the editor's own host. An invalid or unmatched selector
 * reads as empty.
 * When the element is hovered, `onHoverEnd` runs once the pointer leaves it;
 * the returned `unwatch` stops that.
 */
export const getComputedStyles = (
  selector: string,
  properties: Array<string>,
  onHoverEnd: () => void = () => undefined,
  element?: Element | null
): { styles: Record<string, string>; unwatch: (() => void) | null } => {
  if (!element) {
    try {
      element = Array.from(document.querySelectorAll(selector)).find(
        el => !el.closest('#stylebot')
      );
    } catch {
      return { styles: {}, unwatch: null };
    }
  }

  if (!element) {
    return { styles: {}, unwatch: null };
  }

  const style = getComputedStyle(element);

  return {
    styles: Object.fromEntries(
      properties.map(property => [property, style.getPropertyValue(property)])
    ),
    unwatch: watchHoverEnd(element, onHoverEnd),
  };
};
