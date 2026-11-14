import { getTemplateParts } from './class-templates';
import { caseTransitionRatio, hasDigitAmongLetters } from './hash-shape';

/**
 * The authored parts of a class a build tool combined with a hash, e.g.
 * `Header_nav__` from CSS Modules' `Header_nav__a1B2c`, by the build tool's
 * naming template.
 */
export function getStableClassParts(className: string): Array<string> | null {
  return getTemplateParts(className);
}

/**
 * Generated classes with no authored part: CSS-in-JS prefixes, React Native
 * Web's atomic classes (X), Instagram's legacy `_a6hd`, vanilla-extract's
 * `_7uluu50`, the Google bar's `gb_Ra`, Svelte/Astro scoping, next/font,
 * JSS counters, and Angular's animation classes.
 */
const GENERATED_CLASS_PATTERNS = [
  /^css-(?=[a-z]*\d)[0-9a-z]{5,8}(-|$)/,
  /^(sc|jsx|emotion|styled|chakra)-/i,
  /^r-(?=[a-z]*\d)[0-9a-z]{6,9}$/,
  /^_(?=[a-z]*\d)[0-9a-z]{4}$/,
  /^_\d[0-9a-z]{4,9}$/,
  /^gb_[0-9A-Za-z]{1,3}$/,
  /^(svelte|astro)-[0-9a-z]{5,8}$/i,
  /^__(className|variable)_[0-9a-f]{6}$/,
  /^jss\d+$/,
  /^ng-tns-c\d+-\d+$/,
  /^makeStyles-.+-\d+$/,
];

const REACT_NATIVE_WEB_CLASS = /^(r|css)-[0-9a-z]{6,9}$/;
const STYLEX_CLASS = /^x[0-9a-z]{5,7}$/;
const STYLEX_PAGE_THRESHOLD = 10;

/**
 * Whether the page is styled with StyleX (Facebook, Instagram, Threads),
 * whose atomic classes like `xeuugli` can't be told from a word like
 * `xlarge` alone, only by how many of them the page has.
 */
function pageUsesStyleX(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  const found = new Set<string>();
  for (const el of Array.from(document.querySelectorAll('[class]'))) {
    for (const name of Array.from(el.classList)) {
      if (STYLEX_CLASS.test(name)) {
        found.add(name);
        if (found.size >= STYLEX_PAGE_THRESHOLD) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Whether the page is styled by React Native Web (X), whose atomic classes
 * are all letters as often as not (`r-sdzlij`), marked by its own stylesheet.
 */
function pageUsesReactNativeWeb(): boolean {
  return (
    typeof document !== 'undefined' &&
    !!document.getElementById('react-native-stylesheet')
  );
}

/**
 * Whether the page is styled with styled-components, whose per-style hashes
 * like `kZxyAb` look minified but change whenever a component's css does.
 */
function pageUsesStyledComponents(): boolean {
  return (
    typeof document !== 'undefined' &&
    !!document.querySelector(
      'style[data-styled], [class^="sc-"], [class*=" sc-"]'
    )
  );
}

/**
 * Google's obfuscated names: digits among the letters, and either 5
 * lowercase characters (`m5k28`) or mixed case with no capitalised word in
 * it (`vr1PYe`), unlike `icon24px`, `grid3x3` or `v2Header`.
 */
function isGoogleObfuscated(className: string): boolean {
  if (!/^[a-z0-9]{5,8}$/i.test(className) || !hasDigitAmongLetters(className)) {
    return false;
  }

  if (/^[a-z0-9]{5}$/.test(className)) {
    return true;
  }

  return (
    /[A-Z]/.test(className) &&
    /[a-z]/.test(className) &&
    !/[A-Z][a-z]{3}/.test(className)
  );
}

/**
 * The hashed-class rules before partly hashed and site-specific classes were
 * recognized, kept so selectors for page-wide effects still match the ones
 * already saved.
 */
export function looksHashedByShape(className: string): boolean {
  if (/^(css|sc|jsx|emotion|styled|chakra)-/i.test(className)) {
    return true;
  }

  if (/[-_]/.test(className)) {
    return false;
  }

  if (/^_?[0-9a-f]{5,}$/i.test(className)) {
    return true;
  }

  if (className.length < 4 || className.length > 12) {
    return false;
  }

  return caseTransitionRatio(className) > 0.3;
}

/**
 * Flags build-tool-generated class names (CSS Modules, styled-components,
 * Closure Compiler) by shape, since they carry no stable meaning.
 */
export function looksHashed(className: string): boolean {
  if (GENERATED_CLASS_PATTERNS.some(pattern => pattern.test(className))) {
    return true;
  }

  if (STYLEX_CLASS.test(className) && pageUsesStyleX()) {
    return true;
  }

  if (REACT_NATIVE_WEB_CLASS.test(className) && pageUsesReactNativeWeb()) {
    return true;
  }

  if (getStableClassParts(className)) {
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

  return hasMinifiedShape(className);
}

/**
 * A short name a compiler minified rather than hashed, like Google's
 * `LC20lb` or `MjjYud`: meaningless, but kept across the site's releases,
 * unlike a build hash.
 */
export function looksMinified(className: string): boolean {
  return hasMinifiedShape(className) && !pageUsesStyledComponents();
}

/**
 * Whether a name is shaped like a minified one, which a styled-components
 * hash is too.
 */
function hasMinifiedShape(className: string): boolean {
  if (/[-_]/.test(className) || /^_?[0-9a-f]{5,}$/i.test(className)) {
    return false;
  }

  if (isGoogleObfuscated(className)) {
    return true;
  }

  if (className.length < 4 || className.length > 12) {
    return false;
  }

  // camelCase words have 1-2 case transitions; hashes have far more.
  return caseTransitionRatio(className) > 0.3;
}

/**
 * Ids a page generates on each load, like Google's
 * `tsuid_hsLJaqLJBPu9ruEP7uOYkAo_91`, which a saved rule never matches again.
 */
export function looksGeneratedId(id: string): boolean {
  // React Native Web's ids, as on X: `id__g3bmvlaotyb`.
  if (/^id__[a-z0-9]{6,}$/.test(id)) {
    return true;
  }

  return id
    .split(/[-_:.]+/)
    .some(
      part =>
        part.length >= 10 &&
        /[a-z]/.test(part) &&
        /[A-Z]/.test(part) &&
        /\d/.test(part) &&
        caseTransitionRatio(part) > 0.3
    );
}
