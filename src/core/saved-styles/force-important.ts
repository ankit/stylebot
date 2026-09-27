/**
 * Whether a style forces `!important` onto its declarations. Only false is
 * ever stored, so a missing value, or a missing style, means true.
 */
export const isForceImportant = (style?: {
  forceImportant?: boolean;
}): boolean => style?.forceImportant !== false;
