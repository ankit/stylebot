// format: yyyy-MM-dd'T'HH:mm:ss.SSSxxx
export type Timestamp = string;

export type StylebotEditingMode = 'basic' | 'magic' | 'code';

export type CssDeclaration = { property: string; value: string };

export type StylebotBasicModeSections = {
  text: boolean;
  colors: boolean;
  layout: boolean;
  effects: boolean;
  more: boolean;
};

export type EditorWindowBounds = {
  width: number;
  height: number;
  left: number;
  top: number;
};

export type StylebotLayout = {
  width: number;
  adjustPageLayout: boolean;
  dockLocation: 'left' | 'right' | 'window';
  // Where the separate editor window was last left, restored on next open.
  window?: EditorWindowBounds;
};

export type StylebotFonts = Array<string>;
export type StylebotAppearance = 'light' | 'dark' | 'system';

export type StylebotOptions = {
  contextMenu: boolean;
  fonts: StylebotFonts;
  layout: StylebotLayout;
  mode: StylebotEditingMode;
  basicModeOpenedSections: StylebotBasicModeSections;
  appearance: StylebotAppearance;
  // Key of the last-picked Palette option — a built-in set, or a scheme name from color-schemes.ts.
  lastColorSet: string;
  // Last tab open in the color picker ('already-used' | 'palette' | 'custom').
  lastColorPickerTab: string;
};

export type Style = {
  url: string;
  css: string;
  enabled: boolean;
  readability: boolean;
  modifiedTime: Timestamp;
  // Whether `!important` is forced onto every declaration. Missing means
  // true; only false is ever stored.
  forceImportant?: boolean;
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
  published: string;
};

export type ReadabilityTheme = 'light' | 'dark' | 'sepia';
export type ReadabilitySettings = {
  font: string;
  size: number;
  width: number;
  lineHeight: number;
  theme: ReadabilityTheme;
  justify: boolean;
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
  | 'basic'
  | 'magic'
  | 'code'
  | 'help'
  | 'hide'
  | 'dockLeft'
  | 'dockRight'
  | 'dockWindow'
  | 'resize'
  | 'pageLayout'
  | 'close';

export type StylebotEditorCommands = {
  [key in StylebotEditorCommandName]: string;
};

export type GoogleDriveSyncMetadata = {
  id: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink: string;
};

export type SyncConflict = {
  url: string;
  at: Timestamp;
};

/**
 * What the last successful sync observed. remoteRevision is Drive's
 * modifiedTime for the file and localRevision the styles-metadata stamp;
 * both are opaque strings compared for equality only — never ordered — so
 * that a clock on one machine is never measured against a clock on another.
 * baseStyles is the map both sides agreed on at that point, which is what
 * lets the next merge tell a deletion from an addition; it is absent on
 * profiles that synced before it was recorded.
 */
export type SyncAccount = {
  email: string;
};

export type SyncState = {
  remoteRevision: string;
  localRevision: string;
  lastSyncedAt: Timestamp;
  metadata: GoogleDriveSyncMetadata;
  baseStyles?: StyleMap;
  conflicts?: Array<SyncConflict>;
  account?: SyncAccount;
};

export * from './TabMessage';
export * from './BackgroundPageMessage';
export * from './BackgroundPageMessageResponse';

export { default as TabMessage } from './TabMessage';
export { default as BackgroundPageMessage } from './BackgroundPageMessage';
export { default as BackgroundPageMessageResponse } from './BackgroundPageMessageResponse';
