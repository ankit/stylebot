import type {
  StylebotCodeTheme,
  StylebotOptions,
  StylebotCommands,
  StylebotEditorCommands,
} from '@stylebot/types';

export const defaultOptions: StylebotOptions = {
  mode: 'basic',
  contextMenu: true,
  fonts: [],
  basicModeOpenedSections: {
    text: false,
    colors: false,
    layout: false,
    effects: false,
    more: false,
  },
  layout: {
    width: 360,
    adjustPageLayout: false,
    dockLocation: 'right',
  },
  appearance: 'system',
  codeTheme: 'stylebot',
  lastColorSet: 'neutrals',
  cliAccess: false,
  gallerySuggestions: true,
  activeStyleBadge: false,
};

/**
 * The code editor's themes, in the order they're offered, with their names.
 */
export const codeThemes: Array<{ value: StylebotCodeTheme; name: string }> = [
  { value: 'stylebot', name: 'Stylebot' },
  { value: 'catppuccin', name: 'Catppuccin' },
  { value: 'github', name: 'GitHub' },
  { value: 'gruvbox', name: 'Gruvbox' },
  { value: 'rose-pine', name: 'Rosé Pine' },
  { value: 'solarized', name: 'Solarized' },
];

export const defaultCommands: StylebotCommands = {
  style: 'alt+shift+t',
  stylebot: 'alt+shift+m',
  grayscale: '',
  readability: '',
};

export const defaultEditorCommands: StylebotEditorCommands = {
  inspect: 'i',
  basic: 'b',
  magic: 'p',
  code: 'c',
  help: '?',
  hide: 'h',
  dockLeft: 'l',
  dockRight: 'r',
  dockWindow: 'w',
  dockSidePanel: 's',
  pageLayout: 'a',
  close: 'Escape',
};

export {
  READABILITY_SETTINGS_KEY,
  defaultReadabilitySettings,
  getReadabilitySettings,
} from './readability';

export {
  CLI_PERMISSIONS,
  supportsCLI,
  hasCliPermissions,
  requestCliPermissions,
  removeCliPermissions,
  setCliConnected,
  getCliConnected,
  onCliConnectedChange,
} from './cli';
