import { queryWithShadowRoots } from '@stylebot/stylesheets';

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

  let timer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Listens on window, where the inspector's blocking of the page's hover
   * events can't reach, and checks :hover once the move has settled.
   */
  const onMouseOut = (event: MouseEvent): void => {
    if (!event.composedPath().includes(element)) {
      return;
    }

    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!element.matches(':hover')) {
        unwatch();
        onHoverEnd();
      }
    });
  };

  const unwatch = (): void => {
    clearTimeout(timer);
    window.removeEventListener('mouseout', onMouseOut, true);
  };

  window.addEventListener('mouseout', onMouseOut, true);

  return unwatch;
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
      element = queryWithShadowRoots(selector).find(
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
