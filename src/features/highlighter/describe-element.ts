import { looksGeneratedId, looksHashedByShape } from '@stylebot/css';

const MAX_CLASSES = 3;

/**
 * Names an element the way dev tools do, e.g. `a#top.storylink`: its tag,
 * id and first few classes, leaving out generated ids and wholly hashed
 * classes like `css-1q2w3e`. A partly hashed class is shown as it is.
 */
export const describeElement = (el: Element): string => {
  const tag = el.tagName.toLowerCase();
  const id = el.getAttribute('id');
  const idPart = id && !looksGeneratedId(id) ? `#${id}` : '';
  const classPart = Array.from(el.classList)
    .filter(name => !looksHashedByShape(name))
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
