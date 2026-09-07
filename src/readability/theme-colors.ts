import { ReadabilityTheme } from '@stylebot/types';

// Shared with loader.ts (matches the reader's own theme background/text) and
// the settings dock's theme swatches.
export const THEME_BACKGROUNDS: Record<ReadabilityTheme, string> = {
  light: '#faf8f3',
  sepia: '#f4ecd8',
  dark: '#201f1d',
};

export const THEME_FOREGROUNDS: Record<ReadabilityTheme, string> = {
  light: '#2b2926',
  sepia: '#5b4636',
  dark: '#cac5bc',
};
