import type { CssDeclaration } from '@stylebot/types';

const BOX_SHORTHANDS: Array<[string, Array<string>]> = [
  ['margin', ['top', 'right', 'bottom', 'left'].map(s => `margin-${s}`)],
  ['padding', ['top', 'right', 'bottom', 'left'].map(s => `padding-${s}`)],
  ['inset', ['top', 'right', 'bottom', 'left']],
  [
    'border-radius',
    ['top-left', 'top-right', 'bottom-right', 'bottom-left'].map(
      s => `border-${s}-radius`
    ),
  ],
];

// Shorthands whose other longhands are usually left at their defaults.
const SOLE_LONGHANDS: Array<[string, string, Array<string>]> = [
  [
    'text-decoration',
    'text-decoration-line',
    [
      'text-decoration-style',
      'text-decoration-color',
      'text-decoration-thickness',
    ],
  ],
];

const PAIR_SHORTHANDS: Array<[string, [string, string]]> = [
  ['overflow', ['overflow-x', 'overflow-y']],
  ['gap', ['row-gap', 'column-gap']],
  // Two opposite sides, once all four haven't already merged into one.
  ['padding-block', ['padding-top', 'padding-bottom']],
  ['padding-inline', ['padding-left', 'padding-right']],
  ['margin-block', ['margin-top', 'margin-bottom']],
  ['margin-inline', ['margin-left', 'margin-right']],
];

const BORDER_SIDES = ['top', 'right', 'bottom', 'left'];
const BORDER_PARTS = ['width', 'style', 'color'];

const boxValue = (values: Array<string>): string => {
  const [top, right, bottom, left] = values;

  if (right === left) {
    if (top === bottom) {
      return top === right ? top : `${top} ${right}`;
    }

    return `${top} ${right} ${bottom}`;
  }

  return values.join(' ');
};

/**
 * Collapses complete sets of longhands (all four padding sides, say) into
 * their shorthand, keeping it where the first of them was.
 */
export const mergeShorthands = (
  declarations: Array<CssDeclaration>
): Array<CssDeclaration> => {
  const values = new Map(declarations.map(d => [d.property, d.value]));
  const merged = new Map<string, CssDeclaration>();

  const collapse = (
    shorthand: string,
    longhands: Array<string>,
    value: string
  ) => {
    longhands.forEach(longhand => values.delete(longhand));
    merged.set(longhands[0], { property: shorthand, value });
  };

  const all = (longhands: Array<string>): Array<string> | null => {
    const found = longhands.map(longhand => values.get(longhand));
    return found.every(Boolean) ? (found as Array<string>) : null;
  };

  const border = all(
    BORDER_SIDES.flatMap(side => BORDER_PARTS.map(p => `border-${side}-${p}`))
  );

  if (border) {
    const [width, style, color] = BORDER_PARTS.map(part =>
      BORDER_SIDES.map(side => values.get(`border-${side}-${part}`))
    );
    const uniform = [width, style, color].every(v => new Set(v).size === 1);

    if (uniform) {
      collapse(
        'border',
        BORDER_SIDES.flatMap(side =>
          BORDER_PARTS.map(p => `border-${side}-${p}`)
        ),
        [width[0], style[0], color[0]].join(' ')
      );
    }
  }

  for (const [shorthand, longhands] of BOX_SHORTHANDS) {
    const found = all(longhands);

    if (found) {
      collapse(shorthand, longhands, boxValue(found));
    }
  }

  for (const [shorthand, longhands] of PAIR_SHORTHANDS) {
    const found = all(longhands);

    if (found) {
      collapse(
        shorthand,
        longhands,
        found[0] === found[1] ? found[0] : found.join(' ')
      );
    }
  }

  for (const [shorthand, longhand, others] of SOLE_LONGHANDS) {
    const value = values.get(longhand);

    if (value && others.every(other => !values.has(other))) {
      collapse(shorthand, [longhand], value);
    }
  }

  return declarations.flatMap(({ property, value }) => {
    if (merged.has(property)) {
      return [merged.get(property) as CssDeclaration];
    }

    return values.has(property) ? [{ property, value }] : [];
  });
};
