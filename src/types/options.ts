export type StylebotEditingMode = 'basic' | 'magic' | 'code';

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
