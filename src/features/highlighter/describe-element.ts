const MAX_CLASSES = 3;

/**
 * Names an element the way dev tools do, e.g. `a#top.storylink`: its tag,
 * id and first few classes, exactly as the page has them.
 */
export const describeElement = (el: Element): string => {
  const tag = el.tagName.toLowerCase();
  const id = el.getAttribute('id');
  const idPart = id ? `#${id}` : '';
  const classPart = Array.from(el.classList)
    .slice(0, MAX_CLASSES)
    .map(name => `.${name}`)
    .join('');

  return `${tag}${idPart}${classPart}`;
};

/**
 * The element's rendered size in css pixels, e.g. `120 × 24`.
 */
export const describeSize = (el: Element): string => {
  const { width, height } = el.getBoundingClientRect();

  return `${Math.round(width)} × ${Math.round(height)}`;
};
