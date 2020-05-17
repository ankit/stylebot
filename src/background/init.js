/**
 * Background Page
 */
var cache = {
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

/**
 * Initialize the background page cache
 */
function initCache(callback) {
  chrome.storage.local.get(['options', 'styles'], function (items) {
    if (items['options']) {
      cache.options = items['options'];
    }

    if (items['styles']) {
      cache.styles = new Styles(items['styles']);
    } else {
      cache.styles = new Styles({});
    }

    if (callback) {
      callback();
    }
  });
}

BrowserAction.init();

updateVersion(function () {
  initCache(function () {
    ContextMenu.init();
  });
});
