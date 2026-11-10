import {
  getStableClassParts,
  looksGeneratedId,
  looksHashed,
} from '../hashed-class';
import { escapeAttributeValue, escapeSelectorToken } from './selector-text';
import { countMatches } from './reach';

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

export const getTestIdBasedSelector = (el: HTMLElement): string | null => {
  for (const attribute of TEST_ID_ATTRIBUTES) {
    const value = el.getAttribute(attribute);
    if (value) {
      return `${el.tagName.toLowerCase()}[${attribute}="${escapeAttributeValue(
        value
      )}"]`;
    }
  }

  return null;
};

/**
 * Whether a test id is shared by every element of its kind, like
 * `sidebar` or `product-card`. Ids made for one item, such as
 * `product-48213` or `row-7`, and generated ids don't count.
 */
const isSharedTestId = (value: string): boolean =>
  !/\d{3,}|(^|[-_:.])\d+($|[-_:.])/.test(value) && !looksGeneratedId(value);

/**
 * A selector from the element's test id, but only when the test id is
 * shared by every element of its kind, not made for this one item.
 */
const getSharedTestIdBasedSelector = (el: HTMLElement): string | null => {
  const value = TEST_ID_ATTRIBUTES.map(name => el.getAttribute(name)).find(
    Boolean
  );

  return value && isSharedTestId(value) ? getTestIdBasedSelector(el) : null;
};

/**
 * `name` predates data-testid but serves the same role on form elements:
 * an identifier, not a human/screen-reader description like aria-label.
 */
export const getNameBasedSelector = (el: HTMLElement): string | null => {
  const name = el.getAttribute('name');
  if (name) {
    return `${el.tagName.toLowerCase()}[name="${escapeAttributeValue(name)}"]`;
  }

  return null;
};

/**
 * An aria-label that reads the same for everyone: a single line with no
 * email address, unlike e.g. Google's account button label.
 */
const isSharedLabel = (label: string): boolean =>
  !/[\r\n]|\S@\S+\.\S/.test(label);

/**
 * A link's path, when it names a place rather than a page: a relative or
 * absolute address with no query or hash, and no id or date in it.
 */
const getLinkPath = (el: HTMLElement): string | null => {
  const href = el.getAttribute('href');

  return href && href !== '/' && !/[?#]|\d{4,}|^[a-z]+:(?!\/\/)/i.test(href)
    ? href
    : null;
};

/**
 * A link by its address or any element by its aria-label, e.g.
 * `a[href="/section/world"]` or `button[aria-label="Search"]`, for elements
 * with only generated classes. Null while it would match more of the page
 * than the element's own class does.
 */
export const getLabelBasedSelector = (el: HTMLElement): string | null => {
  const tag = el.tagName.toLowerCase();
  const path = tag === 'a' ? getLinkPath(el) : null;
  const ariaLabel = el.getAttribute('aria-label');
  const label = ariaLabel && isSharedLabel(ariaLabel) ? ariaLabel : null;
  const candidates = [
    path && `${tag}[href="${escapeAttributeValue(path)}"]`,
    label && `${tag}[aria-label="${escapeAttributeValue(label)}"]`,
  ].filter((selector): selector is string => Boolean(selector));
  const own = getClassBasedSelector(el);
  const reach = own ? countMatches(own) : Infinity;

  return (
    candidates.find(
      selector => el.matches(selector) && countMatches(selector) <= reach
    ) ?? null
  );
};

export const getClassNames = (el: HTMLElement): Array<string> =>
  (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

export const classSelector = (el: HTMLElement, className: string | undefined) =>
  className
    ? `${el.tagName.toLowerCase()}.${escapeSelectorToken(className)}`
    : null;

/**
 * The first class that isn't hashed, so a stable but non-first class
 * doesn't lose out to a hashed one earlier in the list.
 */
export const getNonHashedClassBasedSelector = (
  el: HTMLElement
): string | null =>
  classSelector(
    el,
    getClassNames(el).find(candidate => !looksHashed(candidate))
  );

/**
 * Just the first class, hashed or not — the fallback once nothing more
 * stable (non-hashed class, test-id, name) is available.
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
 * A selector from a name that says what the element is, like `div.card` or
 * `input[name="q"]`. Skips #id, which only points at one element, and
 * hashed classes: an ancestor's name, as in `div.mw-heading h2`, makes a
 * better selector than those.
 */
export function getDescriptiveSelector(el: HTMLElement): string | null {
  return (
    getSharedTestIdBasedSelector(el) ??
    getNonHashedClassBasedSelector(el) ??
    getTestIdBasedSelector(el) ??
    getNameBasedSelector(el) ??
    getStableClassPartsSelector(el)
  );
}
