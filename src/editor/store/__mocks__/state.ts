import { State } from '..';

const mockState: State = {
  css: '',
  enabled: true,
  url: document.domain,

  activeSelector: '',
  selectors: [],

  options: {
    mode: 'basic',
    useShortcutKey: true,
    shortcutKey: 77,
    shortcutMetaKey: 'alt',
    contextMenu: true,
  },

  visible: false,
  position: 'right',
  inspecting: false,
  help: false,
  darkMode: false,
  readability: false,
};

export default mockState;
