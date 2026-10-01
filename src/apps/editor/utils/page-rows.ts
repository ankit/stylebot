import type { CssDeclaration } from '@stylebot/types';
import { mergeShorthands, toHexColors } from '@stylebot/css';

// Page properties that change how an element looks the most come first.
const VISUAL_PRIORITY = [
  'color',
  'background-color',
  'background-image',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-transform',
  'text-decoration',
  'text-align',
  'padding',
  'margin',
  'border',
  'border-radius',
  'box-shadow',
  'opacity',
  'width',
  'height',
  'max-width',
  'display',
];

const visualRank = (property: string): number => {
  const rank = VISUAL_PRIORITY.indexOf(property);
  return rank === -1 ? VISUAL_PRIORITY.length : rank;
};

/**
 * The page's declarations for properties none of `covered` is or is a
 * shorthand of (so `padding` covers `padding-top`), with complete sets of
 * longhands merged and colors as hex, most visual first.
 */
export const getPageRows = (
  page: Array<CssDeclaration>,
  covered: Array<string>
): Array<CssDeclaration> =>
  mergeShorthands(
    page
      .filter(
        ({ property }) =>
          !covered.some(p => property === p || property.startsWith(`${p}-`))
      )
      .map(({ property, value }) => ({ property, value: toHexColors(value) }))
  )
    .map((declaration, index) => ({ declaration, index }))
    .sort(
      (a, b) =>
        visualRank(a.declaration.property) -
          visualRank(b.declaration.property) || a.index - b.index
    )
    .map(({ declaration }) => declaration);
