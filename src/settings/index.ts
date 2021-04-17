import {
  StylebotOptions,
  StylebotCommands,
  ReadabilitySettings,
  StylebotEditorCommands,
} from '@stylebot/types';

export const defaultOptions: StylebotOptions = {
  mode: 'basic',
  contextMenu: true,
  basicModeSections: {
    text: true,
    colors: true,
    layout: true,
    border: false,
  },
  layout: {
    width: 350,
    adjustPageLayout: false,
    dockLocation: 'right',
  },
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
  magic: 'm',
  code: 'c',
  help: '?',
  hide: 'h',
  resize: 'r',
  dockLeft: 'l',
  dockRight: 'd',
  adjustPageLayout: 'p',
};

export const defaultReadabilitySettings: ReadabilitySettings = {
  size: 16,
  width: 36,
  theme: 'light',
  lineHeight: 1.6,
  font: 'Helvetica',
};
