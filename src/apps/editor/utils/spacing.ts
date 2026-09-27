export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Sides = Record<Side, string>;

export const EMPTY_SIDES: Sides = { top: '', right: '', bottom: '', left: '' };

// Strips the unit from a length value (e.g. '4px' -> '4'), returning ''
// for anything that isn't a plain px value (todo: support other units).
export const parseLength = (value: string): string => {
  if (!value) {
    return '';
  }

  const [length, unit] = value.split(/(-?\d+)/).filter(Boolean);
  return unit === 'px' ? length : '';
};

// Expands the 1-4 value shorthand syntax (e.g. padding: 2px 4px) into
// each side, mirroring the CSS spec's top/right/bottom/left fallback rules.
export const expandShorthand = (value: string): Sides | null => {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length < 1 || parts.length > 4) {
    return null;
  }

  const [top, right = top, bottom = top, left = right] = parts;
  return { top, right, bottom, left };
};

// Collapses four (unitless) side lengths into the shortest equivalent
// 1-4 value shorthand form, mirroring how a human would write it by hand.
export const collapseToShorthand = ({
  top,
  right,
  bottom,
  left,
}: Sides): string => {
  if (top === right && right === bottom && bottom === left) {
    return `${top}px`;
  }

  if (top === bottom && left === right) {
    return `${top}px ${left}px`;
  }

  if (left === right) {
    return `${top}px ${left}px ${bottom}px`;
  }

  return `${top}px ${right}px ${bottom}px ${left}px`;
};

// Uses the shorthand only when every side is set, otherwise writes a
// longhand per set side so unset sides keep the page's own spacing.
export const resolveSpacingDeclarations = (
  sides: Sides,
  properties: Sides,
  shorthandProperty: string
): Array<{ property: string; value: string }> => {
  const sideKeys = Object.keys(sides) as Array<Side>;

  if (sideKeys.every(side => sides[side])) {
    return [
      { property: shorthandProperty, value: collapseToShorthand(sides) },
      ...sideKeys.map(side => ({ property: properties[side], value: '' })),
    ];
  }

  return [
    { property: shorthandProperty, value: '' },
    ...sideKeys.map(side => ({
      property: properties[side],
      value: sides[side] ? `${sides[side]}px` : '',
    })),
  ];
};
