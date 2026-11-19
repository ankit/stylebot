export type StylebotEditingMode = 'basic' | 'code';

export type StylebotBasicModeSection =
  | 'text'
  | 'colors'
  | 'layout'
  | 'border'
  | 'effects'
  | 'more';

// The Basic tab sections the user collapsed; every other section is open.
export type StylebotCollapsedSections = Partial<
  Record<StylebotBasicModeSection, boolean>
>;

export type EditorWindowBounds = {
  width: number;
  height: number;
  left: number;
  top: number;
};

export type FloatingPanelBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type StylebotDockLocation =
  | 'left'
  | 'right'
  | 'floating'
  | 'window'
  | 'sidepanel';

export type StylebotLayout = {
  width: number;
  adjustPageLayout: boolean;
  dockLocation: StylebotDockLocation;
  // Where the separate editor window was last left, restored on next open.
  window?: EditorWindowBounds;
  // Where the in-page panel was last left floating, restored on next open.
  floating?: FloatingPanelBounds;
};

export type StylebotFonts = Array<string>;
export type StylebotAppearance = 'light' | 'dark' | 'system';
export type StylebotCodeTheme =
  | 'stylebot'
  | 'catppuccin'
  | 'github'
  | 'gruvbox'
  | 'rose-pine'
  | 'solarized';

export type StylebotOptions = {
  contextMenu: boolean;
  fonts: StylebotFonts;
  layout: StylebotLayout;
  mode: StylebotEditingMode;
  basicModeCollapsedSections: StylebotCollapsedSections;
  appearance: StylebotAppearance;
  // Colour theme for the code editor, shown in its light or dark variant.
  codeTheme: StylebotCodeTheme;
  // Key of the last-picked Palette option — a built-in set, or a scheme name from color-schemes.ts.
  lastColorSet: string;
  // Lets the stylebot CLI connect, while its optional permissions are granted too.
  cliAccess: boolean;
  // Shows popular gallery styles for the site in the popup.
  gallerySuggestions: boolean;
  // Shows the number of styles active on the page on the toolbar icon.
  activeStyleBadge: boolean;
};
