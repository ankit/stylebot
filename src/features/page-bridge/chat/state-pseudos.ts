const STATE_PSEUDO =
  /::?(?:hover|active|focus|focus-visible|focus-within|visited|placeholder|before|after|selection|marker|first-line|first-letter|backdrop|file-selector-button|-webkit-[\w-]+|-moz-[\w-]+)(?![\w-])/g;

/**
 * Whether the selector names a state (:hover, :focus) or a pseudo-element,
 * which querySelectorAll can't match as written.
 */
export const hasStatePseudo = (selector: string): boolean =>
  new RegExp(STATE_PSEUDO.source).test(selector);

/**
 * The selector for the elements it styles in some state or through a
 * pseudo-element: `a:hover` and `input::placeholder` become `a` and `input`.
 */
export const withoutStatePseudos = (selector: string): string =>
  selector
    .split(',')
    .map(part => {
      const stripped = part.replace(STATE_PSEUDO, '');
      return !stripped.trim() || /[\s>+~]\s*$/.test(stripped)
        ? `${stripped.trimEnd()} *`.trimStart()
        : stripped.trimEnd();
    })
    .join(',');
