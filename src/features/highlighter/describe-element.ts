import {
  getStableClassParts,
  looksGeneratedId,
  looksHashedByShape,
} from '@stylebot/css';

const MAX_CLASSES = 3;

/**
 * A class as the label shows it: a partly hashed one by its authored name,
 * e.g. `Header_nav` for `Header_nav__a1B2c`.
 */
const showClass = (name: string): string => {
  const parts = getStableClassParts(name);

  return parts ? parts[0].replace(/^[-_]+|[-_]+$/g, '') : name;
};

/**
 * Names an element the way dev tools do, e.g. `a#top.storylink`: its tag,
 * id and first few classes, leaving out generated ids and hashed classes.
 */
export const describeElement = (el: Element): string => {
  const tag = el.tagName.toLowerCase();
  const id = el.getAttribute('id');
  const idPart = id && !looksGeneratedId(id) ? `#${id}` : '';
  const classPart = Array.from(el.classList)
    .filter(name => !looksHashedByShape(name))
    .slice(0, MAX_CLASSES)
    .map(name => `.${showClass(name)}`)
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
