const escapeSelectorToken = (value: string): string => {
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

/**
 * Flags build-tool-generated class names (CSS Modules, styled-components,
 * Closure Compiler) by shape, since they carry no stable meaning.
 */
function looksHashed(className: string): boolean {
  if (/^(css|sc|jsx|emotion|styled|chakra)-/i.test(className)) {
    return true;
  }

  // An intentional separator means an authored name, whatever its shape.
  if (/[-_]/.test(className)) {
    return false;
  }

  // A hex-like hash, e.g. CSS Modules' "_1a2b3c".
  if (/^_?[0-9a-f]{5,}$/i.test(className)) {
    return true;
  }

  if (className.length < 4 || className.length > 12) {
    return false;
  }

  // camelCase words have 1-2 case transitions; hashes have far more.
  let transitions = 0;
  for (let i = 1; i < className.length; i++) {
    const prevUpper = className[i - 1] !== className[i - 1].toLowerCase();
    const curUpper = className[i] !== className[i].toLowerCase();
    if (prevUpper !== curUpper) {
      transitions++;
    }
  }

  return transitions / className.length > 0.3;
}

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
 * Excludes #id and hashed classes on purpose, so a real ancestor match
 * (see getAncestorBasedSelector) still outranks them.
 */
function getGoodOwnSelector(el: HTMLElement): string | null {
  return (
    getNonHashedClassBasedSelector(el) ??
    getTestIdBasedSelector(el) ??
    getNameBasedSelector(el)
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

/**
 * #id ranks above a hashed class but below anything genuinely authored,
 * the element's own or an ancestor's. See src/css/README.md.
 */
export const getSelector = (el: HTMLElement): string => {
  return (
    getGoodOwnSelector(el) ??
    getAncestorBasedSelector(el) ??
    getIdBasedSelector(el) ??
    getClassBasedSelector(el) ??
    getAncestorHashedClassSelector(el) ??
    getTagNameBasedSelector(el)
  );
};

/**
 * The members of a comma-separated selector list, trimmed.
 */
export const splitSelectorList = (selector: string): Array<string> =>
  selector
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

export const validateSelector = (selector: string): boolean => {
  if (!selector) {
    return false;
  }

  try {
    document.querySelector(selector);
    return true;
  } catch (e) {
    return false;
  }
};
