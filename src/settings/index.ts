import {
  StylebotOptions,
  StylebotCommands,
  ReadabilitySettings,
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
    width: 350,
    adjustPageLayout: false,
    dockLocation: 'right',
  },
  appearance: 'system',
  lastColorSet: 'neutrals',
  lastColorPickerTab: 'already-used',
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
  help: '?',
  hide: 'h',
  resize: 's',
  dockLeft: 'l',
  dockRight: 'r',
  dockWindow: 'w',
  pageLayout: 'a',
  close: 'Escape',
};

export const defaultReadabilitySettings: ReadabilitySettings = {
  size: 16,
  width: 40,
  theme: 'light',
  lineHeight: 1.6,
  justify: false,
  font: 'Merriweather',
};
