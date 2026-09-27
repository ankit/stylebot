/**
 * Reads computed values for the first element a selector matches, skipping
 * the editor's own host. An invalid or unmatched selector reads as empty.
 */
export const getComputedStyles = (
  selector: string,
  properties: Array<string>
): Record<string, string> => {
  let element: Element | undefined;

  try {
    element = Array.from(document.querySelectorAll(selector)).find(
      el => !el.closest('#stylebot')
    );
  } catch {
    return {};
  }

  if (!element) {
    return {};
  }

  const style = getComputedStyle(element);

  return Object.fromEntries(
    properties.map(property => [property, style.getPropertyValue(property)])
  );
};
