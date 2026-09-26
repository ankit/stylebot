import type { State } from '..';
import { emptyPageSnapshot } from '@stylebot/page-bridge';

import {
  defaultOptions,
  defaultReadabilitySettings,
  defaultCommands,
  defaultEditorCommands,
} from '@stylebot/settings';

const mockState: State = {
  host: 'page',
  page: { ...emptyPageSnapshot(), domain: document.domain },
  pageConnected: true,
  windowConnected: false,
  tabId: null,
  tab: null,

  css: '',
  enabled: true,
  url: document.domain,

  selectors: [],
  activeSelector: '',
  computedStyles: {},
  contextMenuSelector: '',

  help: false,
  visible: false,
  inspecting: false,
  readability: false,
  forceImportant: true,
  colorPickerVisible: false,

  options: defaultOptions,
  commands: defaultCommands,
  editorCommands: defaultEditorCommands,
  readabilitySettings: defaultReadabilitySettings,
};

export default mockState;
