/**
  * This content script initializes stylebot
 **/

$(document).ready(function() {
    stylebot.chrome.fetchOptions();
});

// callback for request sent to background.html in stylebot.chrome.fetchOptions()
function initialize(response) {
    // init accordion state
    stylebot.widget.basic.enabledAccordions = response.enabledAccordions;
    stylebot.initialize(response.options);
    attachListeners();
}

function attachListeners() {

    document.addEventListener('keydown', function(e) {
        
        if (isInputField(e.target))
           return true;

        if (stylebot.options.useShortcutKey && e.keyCode == stylebot.options.shortcutKey)
        {
            if (stylebot.options.shortcutMetaKey == 'ctrl' && e.ctrlKey
              || stylebot.options.shortcutMetaKey == 'shift' && e.shiftKey
              || stylebot.options.shortcutMetaKey == 'alt' && e.altKey
              || stylebot.options.shortcutMetaKey == 'none')
            stylebot.toggle();
        }
        
        // Handle Esc key to escape editing mode
        else if (e.keyCode == 27 &&
            stylebot.status &&
            !stylebot.widget.basic.isColorPickerVisible &&
            !stylebot.modal.isVisible &&
            e.target.tagName.toLowerCase() != 'select'
        )
        {
            e.target.blur();
            stylebot.disable();
        }
        return true;
    
    }, true);
}

function isInputField(el) {
    var tagName = el.tagName.toLowerCase();
    var inputTypes = ['input', 'textarea', 'div', 'object'];
    
    if ($.inArray( tagName, inputTypes) != -1 ||
    el.id == "stylebot"
    )
        return true;
    else
        return false;
}