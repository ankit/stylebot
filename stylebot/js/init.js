/**
  * This content script initializes the stylebot widget
 **/

lintDebug = false;

$( document ).ready(function() {
    initDebug();
    stylebot.chrome.fetchOptions();
});

// callback for request sent to background.html in stylebot.chrome.fetchOptions()
function initialize( response ) {
    // init accordion state
    stylebot.widget.basic.enabledAccordions = response.enabledAccordions;
    stylebot.initialize( response.options );
    addDOMListeners();
}

function initDebug() {
    if( lintDebug )
        jQuery.LINT.level = 3;
    else
        jQuery.LINT.level = 0;
}

function addDOMListeners() {
    // Handle key presses
    $( document ).keydown( function(e) {
        if( isInputField( e.target ) )
           return true;

        // Handle shortcut key combo 'ctrl + e' to toggle editing mode
        if( stylebot.options.useShortcutKey && e.keyCode == stylebot.options.shortcutKey )
        {
            if( stylebot.options.shortcutMetaKey == 'ctrl' && e.ctrlKey
              || stylebot.options.shortcutMetaKey == 'shift' && e.shiftKey
              || stylebot.options.shortcutMetaKey == 'alt' && e.altKey
              || stylebot.options.shortcutMetaKey == 'none' )
            stylebot.toggle();
        }
        
        // Handle Esc key to escape editing mode
        else if( e.keyCode == 27 && stylebot.status && !WidgetUI.isColorPickerVisible && !stylebot.modal.isVisible )
            stylebot.disable();
    })
    
    // Handle mouse move event on DOM elements
    .mouseover( function(e) {
        var target = $( e.target );
        if( $( target ).hasClass( "stylebot-selection" ) )
            return true;
        if( stylebot.widget.isBeingDragged || stylebot.modal.isVisible )
            return true;
        if( stylebot.hoveredElement == $( target ) || !stylebot.status || !stylebot.selectionStatus )
            return true;
        
        if( belongsToStylebot( $( target ) ) )
        {
            stylebot.unhighlight();
            return true;
        }
        stylebot.highlight( target );
    });
    
    // Handle click event on document.body (during capturing phase)
    document.body.addEventListener( 'click', function(e) {
        if( stylebot.hoveredElement && stylebot.status && !belongsToStylebot( $(e.target) ) )
        {
            e.preventDefault();
            e.stopPropagation();
            if( stylebot.selectionStatus )
            {
                stylebot.select();
                return false;
            }
        }
        return true;
    }, true );
}

function belongsToStylebot( el ) {
    var parent = el.closest( '#stylebot, .stylebot_colorpicker' );
    var id = el.attr( 'id' );
    if( parent.length != 0 || id.indexOf( "stylebot" ) != -1 )
        return true;
    return false;
}

function isInputField( el ) {
    var tagName = el.tagName.toLowerCase();
    var inputTypes = [ 'input', 'textarea', 'div', 'object', 'select' ];
    if( $.inArray( tagName, inputTypes ) != -1 )
        return true;
    else
        return false;
}