/**
  * stylebot
  * Source: http://github.com/ankit/stylebot
  *
  * Copyright (c) 2010 Ankit Ahuja
  * Dual licensed under GPL and MIT licenses.
 **/

$(document).ready(function() {
    stylebot.init();
});

var stylebot = {

    status: false,

    selectedElement: null,

    hoveredElement: null,

    selectMode: true,
    
    // kill switch for jQuery lint
    lintDebug: false,

    options: {
        useShortcutKey: true,
        shortcutKey: 69, // 69 is keycode for 'e'
        shortcutMetaKey: 'ctrl',
        mode: 'Basic',
        position: 'Right'
    },
    
    init: function() {
        this.style.init();
        this.chrome.fetchOptions();
        this.initDebug();
        this.addListeners();
    },
    
    // callback for request sent to background.html in stylebot.chrome.fetchOptions()
    setOptions: function(options) {
        this.options.useShortcutKey = options.useShortcutKey;
        this.options.shortcutKey = options.shortcutKey;
        this.options.shortcutMetaKey = options.shortcutMetaKey;
        this.options.mode = options.mode;
    },
    
    initDebug: function() {
        if(this.lintDebug)
            jQuery.LINT.level = 3;
        else
            jQuery.LINT.level = 0;
    },
    
    // toggle stylebot editing status
    toggle: function() {
        if(this.status == true)
            this.disable();
        else
            this.enable();
    },
    
    enable: function() {
        this.widget.show();
        this.status = true;
        this.chrome.setIcon(true);
        this.enableSelectionMode();
        this.style.initInlineCSS();
    },
    
    disable: function() {
        this.widget.hide();
        this.status = false;
        this.chrome.setIcon(false);
        this.widget.updateRuleCache();
        this.style.reset();
        this.disableSelectionMode();
        this.unhighlight();
        this.selectedElement = null;
    },
    
    addListeners: function() {
        // Handle key presses
        $(document).keydown( function(e) {
            var eTagName = e.target.tagName.toLowerCase();
            var disabledEl = ['input', 'textarea', 'div', 'object', 'select'];
            if( $.inArray(eTagName, disabledEl) != -1 )
               return true;

            // Handle shortcut key combo 'ctrl + e' to toggle editing mode
            if( stylebot.options.useShortcutKey && e.keyCode == stylebot.options.shortcutKey )
            {
                if( stylebot.options.shortcutMetaKey == 'ctrl' && e.ctrlKey 
                  || stylebot.options.shortcutMetaKey == 'shift' && e.shiftKey
                  || stylebot.options.shortcutMetaKey == 'none' )
                stylebot.toggle();
            }
            
            // Handle Esc key to escape editing mode
            else if(e.keyCode == 27 && stylebot.status && !stylebot.widget.ui.isColorPickerVisible && !stylebot.modal.isVisible)
                stylebot.disable();
        })

        // Handle mouse move event on DOM elements
        .mousemove( function(e) {
            if( stylebot.widget.isBeingDragged || stylebot.modal.isVisible )
                return true;
            if( stylebot.hoveredElement == $(e.target) || !stylebot.status || !stylebot.selectMode )
                return true;

            var parent = $(e.target).closest( '.ui-dialog, #stylebot, .stylebot_colorpicker' );
            var id = $(e.target).attr('id');
            
            if(id.indexOf("stylebot") != -1 || parent.length != 0)
            {
                stylebot.unhighlight();
                return true;
            }
            stylebot.highlight(e.target);
        });
        
        // Handle click event on document.body (during capturing phase)
        document.body.addEventListener('click', function(e) {
            if(stylebot.hoveredElement && stylebot.status && stylebot.selectMode)
            {
                e.preventDefault();
                e.stopPropagation();
                stylebot.select();
                return false;
            }
        }, true);
    },
    
    highlight: function(el) {
        if(stylebot.hoveredElement)
            stylebot.hoveredElement.removeClass('stylebot-selected');
        stylebot.hoveredElement = $(el);
        stylebot.hoveredElement.addClass('stylebot-selected');
    },
    
    unhighlight: function() {
        if(stylebot.hoveredElement)
            stylebot.hoveredElement.removeClass('stylebot-selected');
        stylebot.hoveredElement = null;
    },
    
    select: function() {
        stylebot.disableSelectionMode();
        stylebot.widget.updateRuleCache();
        stylebot.selectedElement = stylebot.hoveredElement;
        stylebot.style.fillCache( SelectorGenerator.generate(stylebot.selectedElement) );
        stylebot.widget.show();
    },
    
    toggleSelectionMode: function() {
        if(stylebot.selectMode)
            stylebot.disableSelectionMode();
        else
            stylebot.enableSelectionMode();
    },
    
    enableSelectionMode: function() {
        stylebot.selectMode = true;
        stylebot.widget.ui.cache.headerSelectIcon.addClass('stylebot-select-icon-active');
    },
    
    disableSelectionMode: function() {
        stylebot.selectMode = false;
        stylebot.widget.ui.cache.headerSelectIcon.removeClass('stylebot-select-icon-active');
    }
}