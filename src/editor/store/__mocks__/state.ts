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
    fontSize: '16px',
    fontFamily: 'Helvetica',
  },
};

export default mockState;
