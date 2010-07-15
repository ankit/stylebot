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
    
    selectionBox: null,

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
    },
    
    disable: function() {
        stylebot.widget.hide();
        stylebot.status = false;
        stylebot.chrome.setIcon(false);
        stylebot.widget.updateRuleCache();
        stylebot.style.reset();
        stylebot.disableSelection();
        stylebot.unhighlight();
        stylebot.selectedElement = null;
    },
    
    highlight: function(el) {
        if( !stylebot.selectionBox )
            stylebot.createSelectionBox();
        this.selectionBox.show();
        el = $(el);
        stylebot.hoveredElement = el;

        stylebot.selectionBox.highlight( el );
    },
    
    unhighlight: function() {
        stylebot.hoveredElement = null;
        stylebot.selectionBox.hide();
    },
    
    select: function( selector ) {
        stylebot.disableSelection();
        stylebot.widget.updateRuleCache();
        if( selector )
        {
            var el = $( selector )[0];
            stylebot.selectedElement = el;
            stylebot.highlight( el );
        }
        else
        {
            stylebot.selectedElement = stylebot.hoveredElement;
            selector = SelectorGenerator.generate( stylebot.selectedElement );
        }
        stylebot.style.fillCache( selector );
        stylebot.widget.show();
        
        setTimeout( function() {
            stylebot.style.removeFromStyleElement( stylebot.style.cache.selector );
        }, 100);
    },
    
    toggleSelection: function() {
        if( stylebot.selectionStatus ) {
            stylebot.select( stylebot.style.cache.selector );
            stylebot.disableSelection();
        }
        else
        {
            stylebot.widget.disable();
            stylebot.unhighlight();
            stylebot.enableSelection();
        }
    },
    
    enableSelection: function() {
        stylebot.selectionStatus = true;
        stylebot.widget.cache.headerSelectIcon
        .addClass( 'stylebot-select-icon-active' )
        .attr( 'title', 'Click to disable selection of element' );
    },
    
    disableSelection: function() {
        stylebot.selectionStatus = false;
        stylebot.widget.cache.headerSelectIcon
        .removeClass('stylebot-select-icon-active')
        .attr( 'title', 'Click to enable selection of element' );
    },
    
    createSelectionBox: function() {
        stylebot.selectionBox = new SelectionBox( 2, "stylebot-selection" );
    }
}