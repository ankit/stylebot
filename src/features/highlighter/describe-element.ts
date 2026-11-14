import {
  getStableClassParts,
  looksGeneratedId,
  looksHashedByShape,
} from '@stylebot/css';

const MAX_CLASSES = 3;
const MAX_NAME_LENGTH = 24;

const shorten = (name: string): string =>
  name.length > MAX_NAME_LENGTH ? `${name.slice(0, MAX_NAME_LENGTH)}…` : name;

/**
 * A class as the label shows it: a partly hashed one by its authored parts,
 * with an ellipsis for each hash, e.g. `Header_nav__…`.
 */
const showClass = (name: string): string => {
  const parts = getStableClassParts(name);

  if (!parts) {
    return shorten(name);
  }

  const head = name.startsWith(parts[0]) ? '' : '…';
  const tail = name.endsWith(parts[parts.length - 1]) ? '' : '…';

  return `${head}${parts.map(shorten).join('…')}${tail}`;
};

/**
 * Names an element the way dev tools do, e.g. `a#top.storylink`: its tag,
 * id and first few classes, leaving out generated ids and hashed classes.
 * An ellipsis marks classes it left out.
 */
export const describeElement = (el: Element): string => {
  const tag = el.tagName.toLowerCase();
  const id = el.getAttribute('id');
  const idPart = id && !looksGeneratedId(id) ? `#${shorten(id)}` : '';
  const classes = Array.from(el.classList);
  const shown = classes
    .filter(name => !looksHashedByShape(name))
    .slice(0, MAX_CLASSES);
  const classPart = shown.map(name => `.${showClass(name)}`).join('');
  const more = shown.length < classes.length ? '…' : '';

  return `${tag}${idPart}${classPart}${more}`;
};

/**
 * The element's rendered size in css pixels, e.g. `120 × 24`.
 */
export const describeSize = (el: Element): string => {
  const { width, height } = el.getBoundingClientRect();

  return `${Math.round(width)} × ${Math.round(height)}`;
};
