import {
  StylebotOptions,
  StylebotCommands,
  ReadabilitySettings,
  StylebotEditorCommands,
} from '@stylebot/types';

export const defaultOptions: StylebotOptions = {
  mode: 'basic',
  contextMenu: true,
};

export const defaultCommands: StylebotCommands = {
  style: 'alt+shift+s',
  stylebot: 'alt+shift+m',
  grayscale: 'alt+shift+g',
  readability: 'alt+shift+r',
};

export const defaultEditorCommands: StylebotEditorCommands = {
  inspect: 'i',
  position: 'p',
  basic: 'b',
  magic: 'm',
  code: 'c',
  help: '?',
  hide: 'h',
};

export const defaultReadabilitySettings: ReadabilitySettings = {
  size: 16,
  width: 36,
  theme: 'light',
  lineHeight: 1.6,
  font: 'Helvetica',
};
