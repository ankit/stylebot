import { splitCommaList } from '@stylebot/utils';

import { getSubjectCompound } from './get-subject-compound';
import { getStableClassParts, looksHashed } from './hashed-class';

/**
 * An id or class name escaped for use in a selector, so a Tailwind class
 * like `lg:-mt-16` becomes `lg\:-mt-16`.
 */
export const escapeSelectorToken = (value: string): string => {
  if (typeof CSS !== 'undefined' && CSS.escape) {
    return CSS.escape(value);
  }

  // Fallback escape for special characters when CSS.escape is unavailable
  return value.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
};

function escapeAttributeValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

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

const countMatches = (selector: string): number => {
  try {
    return document.querySelectorAll(selector).length;
  } catch {
    return 0;
  }
};

const getClassNames = (el: HTMLElement): Array<string> =>
  (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

const classSelector = (el: HTMLElement, className: string | undefined) =>
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
 * Matches a partly hashed class by its authored parts alone, e.g.
 * `nav[class*="Header_nav__"]`, so it survives the site's next build. Kept
 * only while it matches no more of the page than the full class does.
 */
export const getStableClassPartsSelector = (el: HTMLElement): string | null => {
  const tag = el.tagName.toLowerCase();

  for (const className of getClassNames(el)) {
    const parts = getStableClassParts(className);
    if (!parts) {
      continue;
    }

    const selector = `${tag}${parts
      .map(part => `[class*="${escapeAttributeValue(part)}"]`)
      .join('')}`;
    const fullClass = `${tag}.${escapeSelectorToken(className)}`;

    if (countMatches(selector) === countMatches(fullClass)) {
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

export const getTagNameBasedSelector = (
  el: HTMLElement,
  domHeirarchyLevel = 0
): string => {
  const tagName = el.tagName.toLowerCase();

  // don't go beyond 2 levels up the DOM
  if (domHeirarchyLevel < 2 && el.parentElement) {
    const parent = el.parentElement;
    const parentSelector = getTagNameBasedSelector(
      parent,
      domHeirarchyLevel + 1
    );

    return `${parentSelector} ${tagName}`;
  }

  return tagName;
};

/**
 * Excludes #id and fully hashed classes on purpose, so a real ancestor match
 * (see getAncestorBasedSelector) still outranks them.
 */
function getGoodOwnSelector(el: HTMLElement): string | null {
  return (
    getNonHashedClassBasedSelector(el) ??
    getTestIdBasedSelector(el) ??
    getNameBasedSelector(el) ??
    getStableClassPartsSelector(el)
  );
}

/**
 * Climbs up to 2 levels, stopping at the first ancestor getOwnSelector
 * likes, instead of always reaching a fixed depth.
 */
function climbToNearestUsableAncestor(
  el: HTMLElement,
  getOwnSelector: (el: HTMLElement) => string | null
): string | null {
  const tagChain: Array<string> = [el.tagName.toLowerCase()];
  let current = el;

  for (let level = 0; level < 2; level++) {
    const parent = current.parentElement;
    if (!parent) {
      return null;
    }

    const parentSelector = getOwnSelector(parent);
    if (parentSelector) {
      return [parentSelector, ...tagChain].join(' ');
    }

    tagChain.unshift(parent.tagName.toLowerCase());
    current = parent;
  }

  return null;
}

/**
 * Like getTagNameBasedSelector, but stops at the nearest ancestor (within
 * 2 levels) with a real class/test-id/name, e.g. `div.mw-heading h2`.
 */
export const getAncestorBasedSelector = (el: HTMLElement): string | null =>
  climbToNearestUsableAncestor(el, getGoodOwnSelector);

/**
 * The same climb as getAncestorBasedSelector, but accepting a hashed
 * class too — only reached once nothing better is available anywhere.
 */
function getAncestorHashedClassSelector(el: HTMLElement): string | null {
  return climbToNearestUsableAncestor(el, getClassBasedSelector);
}

// Below this many elements of a tag, matching most of them is still a choice.
const MIN_SWEEP = 20;

/**
 * Whether a scoped selector ending in a bare tag, like `div.app div div`,
 * matches most of the page's elements of that tag, so it's effectively the
 * bare tag and would restyle nearly the whole page.
 */
const isSweeping = (selector: string): boolean => {
  const subject = getSubjectCompound(selector);
  if (subject === selector || !/^[a-z][a-z0-9-]*$/i.test(subject)) {
    return false;
  }

  const all = countMatches(subject);
  return all >= MIN_SWEEP && countMatches(selector) > all / 2;
};

const unlessSweeping = (selector: string | null): string | null =>
  selector && !isSweeping(selector) ? selector : null;

/**
 * #id ranks above a hashed class but below anything genuinely authored,
 * the element's own or an ancestor's. See docs/selectors-and-css.md.
 */
export const getSelector = (el: HTMLElement): string => {
  return (
    getGoodOwnSelector(el) ??
    unlessSweeping(getAncestorBasedSelector(el)) ??
    getIdBasedSelector(el) ??
    getClassBasedSelector(el) ??
    unlessSweeping(getAncestorHashedClassSelector(el)) ??
    getTagNameBasedSelector(el)
  );
};

/**
 * Scopes `el` by each of its nearest ancestors (up to 4 levels) that has a
 * class, test id or name of its own, e.g. `td.subtext a`: each is a step
 * wider or narrower than the others. The element keeps its own class if
 * it has one (`td.title span.sitestr`), since its bare tag says little.
 */
const getAncestorScopedSelectors = (el: HTMLElement): Array<string> => {
  const subject = getGoodOwnSelector(el) ?? el.tagName.toLowerCase();
  const selectors: Array<string> = [];
  let ancestor = el.parentElement;

  for (let level = 0; ancestor && level < 4; level++) {
    const own = getGoodOwnSelector(ancestor) ?? getClassBasedSelector(ancestor);

    if (own) {
      selectors.push(`${own} ${subject}`);
    }

    ancestor = ancestor.parentElement;
  }

  return selectors;
};

// Tags that say what an element is, so "every one of them" is a real choice;
// span or div on their own are just containers.
const MEANINGFUL_TAGS = new Set([
  'a',
  'article',
  'aside',
  'blockquote',
  'button',
  'code',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'img',
  'input',
  'label',
  'li',
  'nav',
  'ol',
  'p',
  'pre',
  'table',
  'td',
  'th',
  'tr',
  'ul',
]);

const getMeaningfulTagSelector = (el: HTMLElement): string | null => {
  const tag = el.tagName.toLowerCase();
  return MEANINGFUL_TAGS.has(tag) ? tag : null;
};

const matchesOf = (selector: string): Array<Element> => {
  try {
    return Array.from(document.querySelectorAll(selector));
  } catch {
    return [];
  }
};

/**
 * Keeps the first of any selectors that match exactly the same elements,
 * so a list only offers choices that change what gets styled.
 */
export const dedupeByMatches = (selectors: Array<string>): Array<string> => {
  const kept: Array<{ selector: string; matches: Array<Element> }> = [];

  for (const selector of new Set(selectors)) {
    const matches = matchesOf(selector);
    const duplicate = kept.some(
      other =>
        other.matches.length === matches.length &&
        other.matches.every((match, i) => match === matches[i])
    );

    if (!duplicate) {
      kept.push({ selector, matches });
    }
  }

  return kept.map(({ selector }) => selector);
};

/**
 * `el`'s own name (or tag), with :nth-of-type when a sibling of the same
 * tag would match it too, e.g. `tr.athing:nth-of-type(3)`.
 */
const getPositionedStep = (el: HTMLElement): string => {
  const own = getGoodOwnSelector(el) ?? el.tagName.toLowerCase();
  const siblings = Array.from(el.parentElement?.children ?? []).filter(
    sibling => sibling.tagName === el.tagName
  );
  const clashes = siblings.some(
    sibling => sibling !== el && sibling.matches(own)
  );

  return clashes ? `${own}:nth-of-type(${siblings.indexOf(el) + 1})` : own;
};

/**
 * A selector matching `el` and nothing else: its positioned step, prefixed
 * by each ancestor's in turn until only `el` matches, stopping at the
 * first ancestor with a unique #id.
 */
export const getUniqueSelector = (el: HTMLElement): string | null => {
  let selector = '';

  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    const id = getIdBasedSelector(node);
    const step = id && countMatches(id) === 1 ? id : getPositionedStep(node);

    selector = selector ? `${step} ${selector}` : step;

    if (countMatches(selector) === 1) {
      return selector;
    }
  }

  return null;
};

/**
 * Elements like `el` within the nearest repeated ancestor it sits in (a
 * row, list item or card), e.g. every link in this one row: a step between
 * just this element and all of its kind.
 */
export const getItemScopedSelector = (el: HTMLElement): string | null => {
  const subject = getGoodOwnSelector(el) ?? el.tagName.toLowerCase();
  let ancestor = el.parentElement;

  for (let level = 0; ancestor && level < 6; level++) {
    if (ancestor === document.body || ancestor === document.documentElement) {
      return null;
    }

    if (getPositionedStep(ancestor).includes(':nth-of-type(')) {
      const item = getUniqueSelector(ancestor);
      return item ? `${item} ${subject}` : null;
    }

    ancestor = ancestor.parentElement;
  }

  return null;
};

/**
 * Every selector the strategies above offer for `el` that actually matches
 * it, most readable first: its own names, then ancestor scopes, then
 * hashed classes and bare tags, then ones scoped to this element's item
 * and to this element alone. Ones sweeping most of the page are left out.
 */
export const getSelectorCandidates = (el: HTMLElement): Array<string> =>
  [
    getNonHashedClassBasedSelector(el),
    getTestIdBasedSelector(el),
    getNameBasedSelector(el),
    getStableClassPartsSelector(el),
    getAncestorBasedSelector(el),
    ...getAncestorScopedSelectors(el),
    getIdBasedSelector(el),
    getClassBasedSelector(el),
    getAncestorHashedClassSelector(el),
    getMeaningfulTagSelector(el),
    getTagNameBasedSelector(el),
    getItemScopedSelector(el),
    getUniqueSelector(el),
  ].filter((selector): selector is string => {
    try {
      return (
        Boolean(selector) &&
        el.matches(selector as string) &&
        !isSweeping(selector as string)
      );
    } catch {
      return false;
    }
  });

/**
 * Sorts selectors narrowest first, by how many elements each matches.
 */
export const byReach = (selectors: Array<string>): Array<string> =>
  selectors
    .map(selector => ({ selector, count: countMatches(selector) }))
    .sort((a, b) => a.count - b.count)
    .map(({ selector }) => selector);

/**
 * The members of a comma-separated selector list, trimmed.
 */
export const splitSelectorList = (selector: string): Array<string> =>
  splitCommaList(selector);

export const validateSelector = (selector: string): boolean => {
  if (!selector) {
    return false;
  }

  try {
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
};

/**
 * Selectors for body's rendered children (not scripts, styles or the
 * editor's own host) — the elements page-wide effects attach to.
 */
export const getBodyChildSelectors = (): Array<string> => {
  const el = document.querySelector('body');
  const nodes: Array<HTMLElement> = Array.prototype.slice.call(el?.childNodes);

  const filteredNodes = nodes.filter(node => {
    if (!node.tagName) {
      return false;
    }

    const tagName = node.tagName.toLowerCase();

    if (
      tagName === 'script' ||
      tagName === 'style' ||
      tagName === 'noscript' ||
      node.id === 'stylebot'
    ) {
      return false;
    }

    return true;
  });

  return filteredNodes.map(node => getSelector(node));
};
