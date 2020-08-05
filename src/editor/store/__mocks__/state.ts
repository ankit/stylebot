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

  visible: false,
  position: 'right',
  inspecting: false,
  help: false,
  readability: false,

  options: defaultOptions,
  commands: defaultCommands,
  editorCommands: defaultEditorCommands,
  readabilitySettings: defaultReadabilitySettings,
};

export default mockState;
