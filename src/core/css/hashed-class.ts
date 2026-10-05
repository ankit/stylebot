function caseTransitionRatio(value: string): number {
  let transitions = 0;
  for (let i = 1; i < value.length; i++) {
    const prevUpper = value[i - 1] !== value[i - 1].toLowerCase();
    const curUpper = value[i] !== value[i].toLowerCase();
    if (prevUpper !== curUpper) {
      transitions++;
    }
  }

  return transitions / value.length;
}

/**
 * A class segment that reads like a build hash rather than a word, e.g.
 * CSS Modules' `a1B2c` or vanilla-extract's `1hiof570`, but not `item2`.
 */
function isHashSegment(segment: string): boolean {
  if (!/^[\w-]{5,10}$/.test(segment) || /^[A-Z]?[a-z]+\d+$/.test(segment)) {
    return false;
  }

  if (/\d/.test(segment) && /[a-z]/i.test(segment)) {
    return true;
  }

  return caseTransitionRatio(segment) > 0.3;
}

/**
 * A 5-character CSS Modules hash at the end of a dash-separated class, like
 * `LS-jX` or `c50BI`, but not a word (`Large`) or a size token (`xs-12`).
 */
function isDashedHash(hash: string): boolean {
  return /[a-z]\d|\d[a-z]/i.test(hash) || caseTransitionRatio(hash) >= 0.4;
}

/**
 * The authored parts of a class a build tool combined with a hash, e.g.
 * `Header_nav__` from CSS Modules' `Header_nav__a1B2c`, `prc-TopicTag-` from
 * Primer's `prc-TopicTag-LS-jX`, or `Nav-sc-` from styled-components'
 * `Nav-sc-1x2y3z-0`.
 */
export function getStableClassParts(className: string): Array<string> | null {
  const styled = className.match(/^(.+-sc-)[a-z0-9]+-\d+$/i);
  if (styled) {
    return [styled[1]];
  }

  // `File-module__local__hash`, as Next.js and Primer name them: the last 5
  // characters are the hash, whatever they look like (`PEHWX`, `yeury`).
  const moduleHash = className.match(/^(.*[-_]module__.+__)[\w-]{5}$/);
  if (moduleHash) {
    return [moduleHash[1]];
  }

  // A React useId suffix, e.g. `button-label-_R_93ades_`.
  const reactId = className.match(/^(.+-)_R_[0-9a-z]+_$/);
  if (reactId) {
    return [reactId[1]];
  }

  // Vite's `_local_hash_line`, e.g. `_card_1wfme_1`.
  const viteModule = className.match(/^(_.+_)[0-9a-z]{5}_\d+$/);
  if (viteModule) {
    return [viteModule[1]];
  }

  // Dash-separated CSS Modules names carry a PascalCase component name,
  // which tells them apart from utility classes like `col-md-12`.
  const dashed = className.match(/^(.+-)([\w-]{5})$/);
  if (dashed && /(^|-)[A-Z][a-z]/.test(dashed[1]) && isDashedHash(dashed[2])) {
    return [dashed[1]];
  }

  const segments = className.split('__');
  const hashAt = segments.findIndex(
    (segment, i) => i > 0 && isHashSegment(segment)
  );
  if (hashAt === -1) {
    return null;
  }

  const before = segments.slice(0, hashAt).join('__');
  const after = segments.slice(hashAt + 1).join('__');

  return after ? [`${before}__`, `__${after}`] : [`${before}__`];
}

/**
 * Generated classes with no authored part: CSS-in-JS prefixes, React Native
 * Web's atomic classes (X), Instagram's legacy `_a6hd`, Svelte/Astro
 * scoping, next/font, and JSS counters.
 */
const GENERATED_CLASS_PATTERNS = [
  /^css-(?=[a-z]*\d)[0-9a-z]{5,8}(-|$)/,
  /^(sc|jsx|emotion|styled|chakra)-/i,
  /^r-(?=[a-z]*\d)[0-9a-z]{6,9}$/,
  /^_(?=[a-z]*\d)[0-9a-z]{4}$/,
  /^(svelte|astro)-[0-9a-z]{5,8}$/i,
  /^__(className|variable)_[0-9a-f]{6}$/,
  /^jss\d+$/,
  /^makeStyles-.+-\d+$/,
];

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

  if (className.length < 4 || className.length > 12) {
    return false;
  }

  // camelCase words have 1-2 case transitions; hashes have far more.
  return caseTransitionRatio(className) > 0.3;
}
