import {
  getStableClassParts,
  looksGeneratedId,
  looksHashed,
  looksMinified,
} from '../hashed-class';
import { escapeAttributeValue, escapeSelectorToken } from './selector-text';
import { countMatches, matchesOf } from './reach';

/**
 * Conventions test frameworks/component libraries use for a stable,
 * intentional targeting hook, checked most-specific first.
 */
const TEST_ID_ATTRIBUTES = [
  'data-testid',
  'data-test-id',
  'data-test',
  'data-cy',
  'data-qa',
];

/**
 * Whether a test id was made for one item, like `product-48213` or `row-7`,
 * or generated on each load, rather than shared by every element of its
 * kind like `sidebar`.
 */
const isPerItemTestId = (value: string): boolean =>
  /\d{3,}|(^|[-_:.])\d+($|[-_:.])/.test(value) || looksGeneratedId(value);

export type NamingAttribute = { name: string; value: string };

/**
 * An attribute as a selector on the element's tag, e.g. `input[name="q"]`.
 */
const attributeSelector = (
  el: Element,
  attribute: NamingAttribute | null
): string | null =>
  attribute
    ? `${el.tagName.toLowerCase()}[${attribute.name}="${escapeAttributeValue(
        attribute.value
      )}"]`
    : null;

const getTestIdAttribute = (el: Element): NamingAttribute | null => {
  for (const name of TEST_ID_ATTRIBUTES) {
    const value = el.getAttribute(name);
    if (value) {
      return { name, value };
    }
  }

  return null;
};

export const getTestIdBasedSelector = (el: HTMLElement): string | null =>
  attributeSelector(el, getTestIdAttribute(el));

/**
 * The element's test id, unless it was made for this one item.
 */
export const getSharedTestIdSelector = (el: HTMLElement): string | null => {
  const attribute = getTestIdAttribute(el);

  return attribute && !isPerItemTestId(attribute.value)
    ? attributeSelector(el, attribute)
    : null;
};

/**
 * `name` predates data-testid but serves the same role on form elements:
 * an identifier, not a human/screen-reader description like aria-label.
 */
const getNameAttribute = (el: Element): NamingAttribute | null => {
  const value = el.getAttribute('name');

  return value ? { name: 'name', value } : null;
};

export const getNameBasedSelector = (el: HTMLElement): string | null =>
  attributeSelector(el, getNameAttribute(el));

/**
 * An aria-label that reads the same for everyone: a single line with no
 * email address, unlike e.g. Google's account button label.
 */
const isSharedLabel = (label: string): boolean =>
  !/[\r\n]|\S@\S+\.\S/.test(label);

const MAX_LINK_LENGTH = 80;

// A path part that reads as a word or words, like `section` or `Valheim`.
const WORD = /^[a-z][a-z_.-]*$/i;

// Where a site's links name its places rather than its content.
const NAVIGATION =
  'nav, header, footer, [role="navigation"], [role="banner"], [role="contentinfo"]';

/**
 * A link's address, when it's a same-site path of words like `/section/world`.
 */
const getLinkPath = (el: Element): string | null => {
  const href = el.getAttribute('href');
  if (!href || href.length > MAX_LINK_LENGTH || /[?#]/.test(href)) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(href, location.href);
  } catch {
    return null;
  }

  const parts = url.pathname.split('/').filter(Boolean);
  const named = parts.length > 0 && parts.every(part => WORD.test(part));

  return url.origin === location.origin && named ? href : null;
};

/**
 * A navigation link's address or any element's aria-label.
 */
const getLabelAttribute = (el: Element): NamingAttribute | null => {
  const inNavigation =
    el.tagName.toLowerCase() === 'a' && el.closest(NAVIGATION) !== null;
  const path = inNavigation ? getLinkPath(el) : null;
  if (path) {
    return { name: 'href', value: path };
  }

  const label = el.getAttribute('aria-label');

  return label && isSharedLabel(label)
    ? { name: 'aria-label', value: label }
    : null;
};

/**
 * A navigation link by its address or any element by its aria-label, e.g.
 * `a[href="/section/world"]` or `button[aria-label="Search"]`.
 */
export const getLabelBasedSelector = (el: HTMLElement): string | null =>
  attributeSelector(el, getLabelAttribute(el));

/**
 * The attribute a selector would name the element by when it has no
 * authored id or class: its test id, form name, or label.
 */
export const getNamingAttribute = (el: Element): NamingAttribute | null =>
  getTestIdAttribute(el) ?? getNameAttribute(el) ?? getLabelAttribute(el);

export const getClassNames = (el: HTMLElement): Array<string> =>
  (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

export const classSelector = (el: HTMLElement, className: string | undefined) =>
  className
    ? `${el.tagName.toLowerCase()}.${escapeSelectorToken(className)}`
    : null;

/**
 * The element's first authored class, else its first minified one, which
 * a compiler keeps across the site's releases.
 */
export const getStableClassSelector = (el: HTMLElement): string | null => {
  const classNames = getClassNames(el);

  return classSelector(
    el,
    classNames.find(name => !looksHashed(name)) ??
      classNames.find(name => looksMinified(name))
  );
};

/**
 * Just the first class, hashed or not.
 */
export const getClassBasedSelector = (el: HTMLElement): string | null =>
  classSelector(el, getClassNames(el)[0]);

/**
 * A partly hashed class as `[class*="…"]` on its authored parts, e.g.
 * `[class*="Header_nav__"]` for `Header_nav__a1B2c`, so it survives the
 * site's next build. Null when it has no hash, or while the parts would
 * match more of the page than the full class does.
 */
export const getStableClassMatcher = (
  className: string,
  tag = ''
): string | null => {
  const parts = getStableClassParts(className);
  if (!parts) {
    return null;
  }

  const matcher = `${tag}${parts
    .map(part => `[class*="${escapeAttributeValue(part)}"]`)
    .join('')}`;
  const fullClass = `${tag}.${escapeSelectorToken(className)}`;

  return countMatches(matcher) === countMatches(fullClass) ? matcher : null;
};

/**
 * The element's first partly hashed class matched by its authored parts,
 * e.g. `nav[class*="Header_nav__"]`.
 */
export const getStableClassPartsSelector = (el: HTMLElement): string | null => {
  const tag = el.tagName.toLowerCase();

  for (const className of getClassNames(el)) {
    const selector = getStableClassMatcher(className, tag);
    if (selector) {
      return selector;
    }
  }

  return null;
};

export const getIdBasedSelector = (el: HTMLElement): string | null => {
  const id = el.getAttribute('id');
  if (id) {
    return `#${escapeSelectorToken(id)}`;
  }

  return null;
};

/**
 * The element's #id, unless the page generates it on each load.
 */
export const getStableIdBasedSelector = (el: HTMLElement): string | null => {
  const id = el.getAttribute('id');
  return id && !looksGeneratedId(id) ? getIdBasedSelector(el) : null;
};

/**
 * The element's #id in place of its own class when at most half of the
 * other elements with that class have ids, like `#sidebar` for
 * `div.flex#sidebar`.
 */
export const getIdOverSharedClass = (el: HTMLElement): string | null => {
  const id = getStableIdBasedSelector(el);
  const ownClass = getStableClassSelector(el);
  if (!id || !ownClass || countMatches(id) !== 1) {
    return null;
  }

  const others = matchesOf(ownClass).filter(match => match !== el);
  const othersWithIds = others.filter(match =>
    getStableIdBasedSelector(match as HTMLElement)
  );

  return others.length === 0 || othersWithIds.length > others.length / 2
    ? null
    : id;
};

/**
 * A name that says what the element is, like `div.card` or
 * `input[name="q"]`, rather than which one it is.
 */
export const getKindSelector = (el: HTMLElement): string | null =>
  getSharedTestIdSelector(el) ??
  getStableClassSelector(el) ??
  getNameBasedSelector(el) ??
  getStableClassPartsSelector(el);

/**
 * The element's own name: its #id over a shared class, else what it is.
 */
export const getOwnNameSelector = (el: HTMLElement): string | null =>
  getIdOverSharedClass(el) ?? getKindSelector(el);
