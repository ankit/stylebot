import {
  getPrimaryFontFamily,
  toHexColors,
  unquoteFamily,
} from '@stylebot/css';

import type { Sides } from './spacing';

const SIDES = ['top', 'right', 'bottom', 'left'];
const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

// Computed shorthands aren't serialized reliably across browsers, so the
// fields' shorthands are read through their longhands.
const LONGHANDS: Record<string, Array<string>> = {
  'border-width': SIDES.map(side => `border-${side}-width`),
  'border-radius': CORNERS.map(corner => `border-${corner}-radius`),
  'border-color': SIDES.map(side => `border-${side}-color`),
  'border-style': SIDES.map(side => `border-${side}-style`),
  'text-decoration': ['text-decoration-line'],
};

// Computed keywords that mean the same as a control's option.
const KEYWORD_ALIASES: Record<string, Record<string, string>> = {
  'text-align': { start: 'left', end: 'right' },
};

export const PLACEHOLDER_PROPERTIES = [
  'font-size',
  'line-height',
  ...SIDES.map(side => `padding-${side}`),
  ...SIDES.map(side => `margin-${side}`),
  ...LONGHANDS['border-width'],
  ...LONGHANDS['border-radius'],
  ...LONGHANDS['border-color'],
  ...LONGHANDS['border-style'],
  'text-decoration-line',
  'text-align',
  'font-family',
  'color',
  'background-color',
];

/**
 * Returns the value when every one agrees, otherwise empty.
 */
export const sharedValue = (...values: Array<string>): string =>
  values.every(value => value === values[0]) ? values[0] : '';

/**
 * A computed px length as a field placeholder, rounded to one decimal;
 * anything else (`normal`, elliptical radii) reads as empty.
 */
export const toPlaceholder = (value = ''): string => {
  const match = value.match(/^(-?[\d.]+)px$/);
  return match ? `${Math.round(parseFloat(match[1]) * 10) / 10}` : '';
};

/**
 * The placeholder for a property's field, read from the page's computed
 * styles; a shorthand gets one only when all its longhands agree.
 */
export const computedPlaceholder = (
  styles: Record<string, string>,
  property: string
): string => {
  // `normal` has no px value; browsers render it at roughly 1.2em.
  if (property === 'line-height' && styles['line-height'] === 'normal') {
    const fontSize = parseFloat(styles['font-size'] ?? '');
    return Number.isNaN(fontSize) ? '' : toPlaceholder(`${fontSize * 1.2}px`);
  }

  return toPlaceholder(
    sharedValue(
      ...(LONGHANDS[property] ?? [property]).map(prop => styles[prop] ?? '')
    )
  );
};

/**
 * Placeholders for each side of a spacing control.
 */
export const computedSides = (
  styles: Record<string, string>,
  properties: Sides
): Sides => ({
  top: computedPlaceholder(styles, properties.top),
  right: computedPlaceholder(styles, properties.right),
  bottom: computedPlaceholder(styles, properties.bottom),
  left: computedPlaceholder(styles, properties.left),
});

/**
 * A computed color as a field placeholder, in hex; a fully transparent one,
 * or the color of a border that isn't drawn, reads as empty.
 */
export const computedColorPlaceholder = (
  styles: Record<string, string>,
  property: string
): string => {
  // An undrawn border still computes to currentColor, i.e. the text color.
  if (
    property === 'border-color' &&
    ['none', 'hidden'].includes(
      computedKeywordPlaceholder(styles, 'border-style')
    )
  ) {
    return '';
  }

  const value = toHexColors(
    sharedValue(
      ...(LONGHANDS[property] ?? [property]).map(prop => styles[prop] ?? '')
    )
  );

  return /^#[0-9a-f]{6}00$/i.test(value) || value === 'transparent'
    ? ''
    : value;
};

/**
 * The page's primary font family for the element, as a field placeholder.
 */
export const computedFontPlaceholder = (
  styles: Record<string, string>
): string => unquoteFamily(getPrimaryFontFamily(styles['font-family'] ?? ''));

/**
 * A computed keyword (text-align, border-style…) as the option it matches,
 * for controls that pick from a fixed set; a shorthand gets one only when
 * all its longhands agree.
 */
export const computedKeywordPlaceholder = (
  styles: Record<string, string>,
  property: string
): string => {
  const value = sharedValue(
    ...(LONGHANDS[property] ?? [property]).map(prop => styles[prop] ?? '')
  );

  return KEYWORD_ALIASES[property]?.[value] ?? value;
};
