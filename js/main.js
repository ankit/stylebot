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
        shortcutKey: 69 // 69 is keycode for 'e'
    },
    
    init: function() {
        this.initCSS();
        this.initDebug();
        this.addListeners();
    },
    
    initDebug: function() {
        if(this.lintDebug)
            jQuery.LINT.level = 3;
        else
            jQuery.LINT.level = 0;
    },
    
    initCSS: function() {
        stylebot.style.load();
    },
    
    // toggle stylebot editing status
    toggle: function() {
        if(this.status == true)
            this.disable();
        else
            this.enable();
    },
    
    enable: function() {
        this.status = true;
        this.widget.show();
        this.chrome.setIcon(true);
        this.enableSelectionMode();
        this.style.initInlineCSS();
    },
    
    disable: function() {
        this.widget.updateRuleCache();
        this.widget.hide();
        this.style.reset();
        this.disableSelectionMode();
        this.unhighlight();
        this.chrome.setIcon(false);
        this.status = false;
        this.selectedElement = null;
        this.selector.value = null;
    },
    
    addListeners: function() {
        // Handle key presses
        $(document).keydown(function(e) {
            var eTagName = e.target.tagName.toLowerCase();
            var disabledEl = ['input', 'textarea', 'div', 'object', 'select'];
            if( $.inArray(eTagName, disabledEl) != -1 )
               return true;

            // Handle shortcut key 'e' to toggle editing mode
            if(e.keyCode == stylebot.options.shortcutKey)
                stylebot.toggle();
                
            // Handle Esc key to escape editing mode
            else if(e.keyCode == 27 && stylebot.status && !stylebot.widget.ui.isColorPickerVisible)
                stylebot.disable();
        })

        // Handle mouse move event on DOM elements
        .mousemove(function(e) {
            if(stylebot.widget.isBeingDragged || stylebot.modal.isVisible)
                return true;
            if(stylebot.hoveredElement == $(e.target) || !stylebot.status || !stylebot.selectMode)
                return true;

            var parent = $(e.target).closest(' .ui-dialog, #stylebot, .stylebot_colorpicker');
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
        stylebot.selector.generate(stylebot.selectedElement);
        stylebot.style.fillCache(stylebot.selector.value);
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