import BackgroundPageStyles from './styles';

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
  },

  importRules: {},

  // Temporary cached map of tabId to rules to prevent recalculating rules
  // for iframes. Cleared when a tab is closed.
  loadingTabs: [],
};

const init = (callback: () => void) => {
  chrome.storage.local.get(['options', 'styles'], items => {
    if (items['options']) {
      window.cache.options = items['options'];
    }

    if (items['styles']) {
      window.cache.styles = new BackgroundPageStyles(items['styles']);
    } else {
      window.cache.styles = new BackgroundPageStyles({});
    }

    if (callback) {
      callback();
    }
  });
};

export default { init };
