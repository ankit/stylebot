import type { State } from '.';
import { emptyUndoStack } from './undo-stack';
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
  profiles: [{ id: 'default', name: '' }],
  activeProfile: 'default',
  undoStack: emptyUndoStack(),
  codeHighlight: null,
  enabled: true,
  url: document.domain,

  selectors: [],
  activeSelector: '',
  computedStyles: {},
  appliedDeclarations: [],
  pageDeclarations: [],
  contextMenuSelector: '',

  help: false,
  visible: false,
  inspecting: false,
  previewSelector: '',
  selectorAlternatives: { existing: [], candidates: [] },
  readability: false,
  forceImportant: true,
  colorPickerVisible: false,

  options: defaultOptions,
  commands: defaultCommands,
  editorCommands: defaultEditorCommands,
  readabilitySettings: defaultReadabilitySettings,
};

export default mockState;
