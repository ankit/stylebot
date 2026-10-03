import type { CssDeclaration } from '@stylebot/types';

import {
  getEffectiveDeclarations,
  resolveValue,
} from './effective-declarations';

const CSS_WIDE_KEYWORDS = [
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
];

// What a size is when nothing sets it.
const SIZE_DEFAULTS: Record<string, Array<string>> = {
  width: ['auto'],
  height: ['auto'],
  'min-width': ['auto', '0', '0px'],
  'min-height': ['auto', '0', '0px'],
  'max-width': ['none'],
  'max-height': ['none'],
  top: ['auto'],
  right: ['auto'],
  bottom: ['auto'],
  left: ['auto'],
};

/**
 * Whether a page declaration changes nothing on its own: a CSS-wide keyword
 * like inherit, or a size's default.
 */
const isNoOp = ({ property, value }: CssDeclaration): boolean => {
  const normalized = value.trim().toLowerCase();

  return (
    CSS_WIDE_KEYWORDS.includes(normalized) ||
    !!SIZE_DEFAULTS[property]?.includes(normalized)
  );
};

/**
 * What the page's own CSS applies directly to `el`, as if Stylebot weren't
 * there, one declaration per property, less those that change nothing on
 * their own.
 */
export const getPageDeclarations = (el: Element): Array<CssDeclaration> => {
  const computed = getComputedStyle(el);

  return Array.from(getEffectiveDeclarations(el, { stylebot: false }))
    .map(([property, { value }]) => ({
      property,
      value: resolveValue(computed, property, value),
    }))
    .filter(declaration => declaration.value !== '' && !isNoOp(declaration));
};
