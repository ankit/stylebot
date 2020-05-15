/**
 * Save an option in cache and datastore.
 * Also pushes the change to all currently open tabs.
 * @param {string} name Option name
 * @param {object} value Option value
 */
function saveOption(name, value) {
  cache.options[name] = value;
  chrome.storage.local.set({ options: cache.options });
  propagateOptions();

  // If the option was contextMenu, update it
  if (name === 'contextMenu') {
    if (value === false) {
      ContextMenu.remove();
    } else {
      ContextMenu.init();
    }
  }
}

/**
 * Propagate options to all existing tabs
 */
function propagateOptions() {
  var req = {
    name: 'setOptions',
    options: cache.options,
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
          chrome.tabs.sendRequest(windows[i].tabs[j].id, req, function (
            response
          ) {});
        }
      }
    }
  );
}

/**
 * Save current accordion state of stylebot editor into background page cache
 * @param {array} accordions Indices of open accordions
 */
function saveAccordionState(accordions) {
  cache.options.accordions = accordions;
  chrome.storage.local.set({
    options: cache.options,
  });
}
