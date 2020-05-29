import ContextMenu from './contextmenu';

/**
 * Propagate options to all existing tabs
 */
const propagateOptions = () => {
  var req = {
    name: 'setOptions',
    options: window.cache.options,
  };

  chrome.windows.getAll(
    {
      populate: true,
    },
    function (windows) {
      var w_len = windows.length;
      for (var i = 0; i < w_len; i++) {
        var t_len = windows[i].tabs.length;
        for (var j = 0; j < t_len; j++) {
          chrome.tabs.sendRequest(windows[i].tabs[j].id, req, () => {});
        }
      }
    }
  );
};

/**
 * Save an option in cache and datastore.
 * Also pushes the change to all currently open tabs.
 */
export const saveOption = (name, value) => {
  window.cache.options[name] = value;
  chrome.storage.local.set({ options: window.cache.options });

  propagateOptions();

  // If the option was contextMenu, update it
  if (name === 'contextMenu') {
    if (value === false) {
      ContextMenu.remove();
    } else {
      ContextMenu.init();
    }
  }
};

/**
 * Save current accordion state of stylebot editor into background page cache
 */
export const saveAccordionState = accordions => {
  window.cache.options.accordions = accordions;

  chrome.storage.local.set({
    options: window.cache.options,
  });
};

export default { saveOption, saveAccordionState };
