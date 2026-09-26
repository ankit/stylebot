/**
 * Whether a style forces `!important` onto its declarations. Only false is
 * ever stored, so a missing value, or a missing style, means true.
 */
export const isForceImportant = (style?: {
  forceImportant?: boolean;
}): boolean => style?.forceImportant !== false;

/**
 * Returns a copy of the style with forceImportant set, storing only false
 * so a true value leaves the field out.
 */
export const withForceImportant = <T extends { forceImportant?: boolean }>(
  style: T,
  forceImportant: boolean
): T => {
  const { forceImportant: _previous, ...rest } = style;
  return (forceImportant ? rest : { ...rest, forceImportant: false }) as T;
};
