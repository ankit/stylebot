import Styles from './styles.js';

// TODO: Make this only accessible as arg / via getters/setters
window.cache = {
  styles: {},

  options: {
    useShortcutKey: true,
    shortcutKey: 77, // keydown code for 'm'
    shortcutMetaKey: 'alt',
    mode: 'Basic',
    sync: false,
    contextMenu: true,
    livePreviewColorPicker: true,
    livePreviewPage: true,
    accordions: [0, 1, 2, 3],
  },

  importRules: {},

  // Temporary cached map of tabId to rules to prevent recalculating rules
  // for iframes. Cleared when a tab is closed.
  loadingTabs: [],
};

const init = callback => {
  chrome.storage.local.get(['options', 'styles'], items => {
    if (items['options']) {
      window.cache.options = items['options'];
    }

    if (items['styles']) {
      window.cache.styles = new Styles(items['styles']);
    } else {
      window.cache.styles = new Styles({});
    }

    if (callback) {
      callback();
    }
  });
};

export default { init };
