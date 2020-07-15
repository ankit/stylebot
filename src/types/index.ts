export type StylebotEditingMode = 'basic' | 'magic' | 'code';
export type StylebotShortcutMetaKey = 'ctrl' | 'shift' | 'alt' | 'none';

export type StylebotOptions = {
  contextMenu: boolean;
  mode: StylebotEditingMode;
  useShortcutKey: boolean;
  shortcutKey: number;
  shortcutMetaKey: StylebotShortcutMetaKey;
};

export type StylebotPlacement = 'left' | 'right';

export type Style = {
  url: string;
  css: string;
  enabled: boolean;
  readability: boolean;
  darkMode: boolean;
};

export type { default as BackgroundPageRequest } from './BackgroundPageRequest';
export type { default as BackgroundPageResponse } from './BackgroundPageResponse';
