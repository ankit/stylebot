/**
 * The share of a name's characters where letter case flips, which is low
 * for camelCase words and high for hashes.
 */
export function caseTransitionRatio(value: string): number {
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
 * Whether a name mixes digits into its letters, like `E0kJGG`, rather than
 * ending in a number like `item12`.
 */
export function hasDigitAmongLetters(value: string): boolean {
  return (
    /\d/.test(value) && /[a-z]/i.test(value) && !/^[A-Z]?[a-z]+\d+$/.test(value)
  );
}

/**
 * A class segment that reads like a build hash rather than a word, e.g.
 * CSS Modules' `a1B2c` or vanilla-extract's `1hiof570`, but not `item2`.
 */
export function isHashSegment(segment: string): boolean {
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
export function isDashedHash(hash: string): boolean {
  return /[a-z]\d|\d[a-z]/i.test(hash) || caseTransitionRatio(hash) >= 0.4;
}

/**
 * Whether a 6-character hash reads like one, e.g. `ZcdlOG` or `w7VYaa`,
 * rather than a camelCase or PascalCase word like `navBar`.
 */
export function isLeadingHash(head: string): boolean {
  const letters = head.replace(/_/g, '');

  if (hasDigitAmongLetters(letters)) {
    return true;
  }

  return (
    /[a-z]/.test(letters) &&
    (letters.match(/[A-Z]/g) ?? []).length >= 2 &&
    !/^[a-z]{2,}([A-Z][a-z]+)+$/.test(letters) &&
    !/^([A-Z][a-z]+)+$/.test(letters)
  );
}

/**
 * Whether a hash whose alphabet includes `_` and `-` reads like one:
 * `eqNI3a`, or `iipd_W` and `S-XPiW`, whose lone capital no authored name
 * would have.
 */
export function isSplitHash(hash: string): boolean {
  return (
    isLeadingHash(hash) ||
    hash.split(/[-_]/).some(piece => /^[A-Z0-9]$/.test(piece))
  );
}

/**
 * Whether a name is a lowercase or camelCase word, like `title` or `navItem`.
 */
export function isCamelWord(value: string): boolean {
  return /^[a-z]+(?:[A-Z][a-z]+)*$/.test(value);
}
