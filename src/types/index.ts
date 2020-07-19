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
};

// https://developer.mozilla.org/en-US/docs/Web/CSS/filter
export type FilterEffect =
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'drop-shadow'
  | 'grayscale'
  | 'hue-rotate'
  | 'invert'
  | 'opacity'
  | 'saturate'
  | 'sepia';

export * from './BackgroundPageRequest';
export * from './BackgroundPageResponse';

export { default as BackgroundPageRequest } from './BackgroundPageRequest';
export { default as BackgroundPageResponse } from './BackgroundPageResponse';

export type ReadabilityArticle = {
  title: string;
  byline: string;
  content: string;
  siteName: string;
};
