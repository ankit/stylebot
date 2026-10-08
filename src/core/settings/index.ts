import type {
  StylebotOptions,
  StylebotCommands,
  StylebotEditorCommands,
} from '@stylebot/types';

export const defaultOptions: StylebotOptions = {
  mode: 'basic',
  contextMenu: true,
  fonts: [
    'Inter',
    'Source Sans 3',
    'Montserrat',
    'Lora',
    'Playfair Display',
    'JetBrains Mono',
    'system-ui',
    'Georgia',
  ],
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
    // Firefox has no side panel; the background reads this back as 'right' there.
    dockLocation: 'sidepanel',
  },
  appearance: 'system',
  lastColorSet: 'neutrals',
  cliAccess: false,
};

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
  chat: 't',
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
} from './cli';
