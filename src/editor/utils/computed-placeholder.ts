import { Sides } from './spacing';

const SIDES = ['top', 'right', 'bottom', 'left'];
const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

// Computed shorthands aren't serialized reliably across browsers, so the
// fields' shorthands are read through their longhands.
const LONGHANDS: Record<string, Array<string>> = {
  'border-width': SIDES.map(side => `border-${side}-width`),
  'border-radius': CORNERS.map(corner => `border-${corner}-radius`),
};

export const PLACEHOLDER_PROPERTIES = [
  'font-size',
  'line-height',
  ...SIDES.map(side => `padding-${side}`),
  ...SIDES.map(side => `margin-${side}`),
  ...LONGHANDS['border-width'],
  ...LONGHANDS['border-radius'],
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
): string =>
  toPlaceholder(
    sharedValue(
      ...(LONGHANDS[property] ?? [property]).map(prop => styles[prop] ?? '')
    )
  );

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
