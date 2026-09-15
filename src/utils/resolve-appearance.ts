import { StylebotAppearance } from '@stylebot/types';

export const resolveAppearance = (
  appearance: StylebotAppearance,
  systemPrefersDark: boolean
): 'light' | 'dark' =>
  appearance === 'system' ? (systemPrefersDark ? 'dark' : 'light') : appearance;
