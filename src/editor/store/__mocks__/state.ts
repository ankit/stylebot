import { State } from '..';

const mockState: State = {
  css: '',
  enabled: true,
  url: document.domain,

  activeSelector: '',
  selectors: [],

  options: {
    mode: 'basic',
    contextMenu: true,
  },

  visible: false,
  position: 'right',
  inspecting: false,
  help: false,
  readability: false,
  readabilitySettings: {
    size: 16,
    width: 40,
    theme: 'light',
    font: 'Helvetica',
  },
  shortcuts: new Map(),
};

export default mockState;
