// format: yyyy-MM-dd'T'HH:mm:ss.SSSxxx
export type Timestamp = string;

export type StylebotEditingMode = 'basic' | 'magic' | 'code';

export type StylebotBasicModeSections = {
  text: boolean;
  colors: boolean;
  layout: boolean;
  border: boolean;
};

export type StylebotCoordinates = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type StylebotOptions = {
  contextMenu: boolean;
  mode: StylebotEditingMode;
  coordinates: StylebotCoordinates;
  basicModeSections: StylebotBasicModeSections;
};

export type Style = {
  url: string;
  css: string;
  enabled: boolean;
  readability: boolean;
  modifiedTime: Timestamp;
};

export type StyleWithoutUrl = Omit<Style, 'url'>;

export type StyleMap = {
  [url: string]: Omit<Style, 'url'>;
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

export type ReadabilityArticle = {
  title: string;
  byline: string;
  content: string;
  siteName: string;
};

export type ReadabilityTheme = 'light' | 'dark' | 'sepia';
export type ReadabilitySettings = {
  font: string;
  size: number;
  width: number;
  lineHeight: number;
  theme: ReadabilityTheme;
};

export type StylebotCommandName =
  | 'stylebot'
  | 'style'
  | 'readability'
  | 'grayscale';

export type StylebotCommands = {
  [key in StylebotCommandName]: string;
};

export type StylebotEditorCommandName =
  | 'inspect'
  | 'position'
  | 'basic'
  | 'magic'
  | 'code'
  | 'help'
  | 'hide';

export type StylebotEditorCommands = {
  [key in StylebotEditorCommandName]: string;
};

export type GoogleDriveSyncMetadata = {
  id: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink: string;
};

export * from './TabMessage';
export * from './BackgroundPageMessage';
export * from './BackgroundPageMessageResponse';

export { default as TabMessage } from './TabMessage';
export { default as BackgroundPageMessage } from './BackgroundPageMessage';
export { default as BackgroundPageMessageResponse } from './BackgroundPageMessageResponse';
