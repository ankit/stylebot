/**
  * stylebot
  * Source: http://github.com/ankit/stylebot
  *
  * Copyright (c) 2010 Ankit Ahuja
  * Dual licensed under GPL and MIT licenses.
 **/

var stylebot = {

    status: false,

    selectedElement: null,

    hoveredElement: null,

    selectionStatus: true,

    options: {
        useShortcutKey: true,
        shortcutKey: 69, // 69 is keycode for 'e'
        shortcutMetaKey: 'ctrl',
        mode: 'Basic',
        position: 'Right'
    },
    
    initialize: function( options ) {
        this.style.initialize();
        this.setOptions( options );
    },
    
    setOptions: function( options ) {
        this.options.useShortcutKey = options.useShortcutKey;
        this.options.shortcutKey = options.shortcutKey;
        this.options.shortcutMetaKey = options.shortcutMetaKey;
        this.options.mode = options.mode;
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
        this.enableSelection();
        this.style.initInlineCSS();
    },
    
    disable: function() {
        this.widget.hide();
        this.status = false;
        this.chrome.setIcon(false);
        this.widget.updateRuleCache();
        this.style.reset();
        this.disableSelection();
        this.unhighlight();
        this.selectedElement = null;
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
        stylebot.disableSelection();
        stylebot.widget.updateRuleCache();
        stylebot.selectedElement = stylebot.hoveredElement;
        stylebot.style.fillCache( SelectorGenerator.generate(stylebot.selectedElement) );
        stylebot.widget.show();
    },
    
    toggleSelection: function() {
        if(stylebot.selectionStatus)
            stylebot.disableSelection();
        else
            stylebot.enableSelection();
    },
    
    enableSelection: function() {
        stylebot.selectionStatus = true;
        stylebot.widget.cache.headerSelectIcon.addClass('stylebot-select-icon-active');
    },
    
    disableSelection: function() {
        stylebot.selectionStatus = false;
        stylebot.widget.cache.headerSelectIcon.removeClass('stylebot-select-icon-active');
    }
}