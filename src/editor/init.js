/**
 * Load options and initialize Stylebot
 */
$(document).ready(function() {
  stylebot.chrome.fetchOptions();
});

/**
 * Callback for request sent to background.html in
 *   stylebot.chrome.fetchOptions()
 * @param {object} response Response containing options
 */
function initialize(response) {
  // init accordion state
  stylebot.widget.basic.accordions = response.options.accordions;
  stylebot.initialize(response.options);
  attachListeners();
}

/**
 * Attach event handlers for launching / closing Stylebot editor
 */
function attachListeners() {
  document.addEventListener(
    'keydown',
    function(e) {
      if (isInputField(e.target)) return true;

      if (
        stylebot.options.useShortcutKey &&
        e.keyCode == stylebot.options.shortcutKey
      ) {
        if (
          (stylebot.options.shortcutMetaKey === 'ctrl' && e.ctrlKey) ||
          (stylebot.options.shortcutMetaKey === 'shift' && e.shiftKey) ||
          (stylebot.options.shortcutMetaKey === 'alt' && e.altKey) ||
          stylebot.options.shortcutMetaKey === 'none'
        ) {
          e.preventDefault();
          e.stopPropagation();
          stylebot.toggle();
          return false;
        }
      }
      // Handle Esc key to escape editing mode
      else if (e.keyCode === 27 && stylebot.shouldClose(e.target)) {
        e.target.blur();
        stylebot.close();
      }
      return true;
    },
    true
  );
}

/**
 * Utility method to check if the currently focused element
 *   can take user input
 */
function isInputField(el) {
  var tagName = el.tagName.toLowerCase();
  var inputTypes = ['input', 'textarea', 'div', 'object'];

  if ($.inArray(tagName, inputTypes) != -1 || el.id === 'stylebot') return true;
  else return false;
}
