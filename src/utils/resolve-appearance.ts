import { StylebotAppearance } from '@stylebot/types';

export const getSystemPreference = (): 'light' | 'dark' =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const resolveAppearance = (
  appearance: StylebotAppearance,
  systemPreference: 'light' | 'dark'
): 'light' | 'dark' => {
  if (appearance !== 'system') {
    return appearance;
  }

  return systemPreference;
};
