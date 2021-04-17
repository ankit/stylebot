import { State } from '..';

import {
  defaultOptions,
  defaultReadabilitySettings,
  defaultCommands,
  defaultEditorCommands,
} from '@stylebot/settings';

const mockState: State = {
  css: '',
  enabled: true,
  url: document.domain,

  selectors: [],
  activeSelector: '',
  contextMenuSelector: '',

  help: false,
  visible: false,
  inspecting: false,
  resize: false,
  readability: false,

  options: defaultOptions,
  commands: defaultCommands,
  editorCommands: defaultEditorCommands,
  readabilitySettings: defaultReadabilitySettings,
};

export default mockState;
