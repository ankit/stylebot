import { State } from '..';

const mockState: State = {
  url: document.domain,
  css: '',

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
};

export default mockState;
