/**
  * stylebot
  * Source: http://github.com/ankit/stylebot
  *
  * Copyright (c) 2010 Ankit Ahuja
  * Dual licensed under GPL and MIT licenses
 **/

var stylebot = {

    status: false,

    selectedElement: null,

    hoveredElement: null,

    selectionStatus: false,
    
    selectionBox: null,

    options: {
        useShortcutKey: true,
        shortcutKey: 77, // 77 is keycode for 'm'
        shortcutMetaKey: 'alt',
        mode: 'Basic',
        position: 'Right',
		sync: false
    },
    
    initialize: function(options) {
        this.style.initialize();
        this.setOptions(options);
        this.contextmenu.initialize();
    },
    
    setOptions: function(options) {
        this.options.useShortcutKey = options.useShortcutKey;
        this.options.shortcutKey = options.shortcutKey;
        this.options.shortcutMetaKey = options.shortcutMetaKey;
        this.options.mode = options.mode;
		this.options.sync = options.sync;
    },
    
    // toggle stylebot editing status
    toggle: function() {
        if (this.status === true)
            this.close();
        else
            this.open();
    },
    
	open: function() {
        this.attachListeners();
		this.style.enable();
        this.widget.open();
        this.status = true;
        this.chrome.setIcon(true);
        this.enableSelection();
        attachKeyboardShortcuts();
    },
    
	close: function() {
        stylebot.detachListeners();
        stylebot.widget.close();
        stylebot.status = false;
        stylebot.chrome.setIcon(false);
        stylebot.style.reset();
        stylebot.disableSelection();
        stylebot.unhighlight();
        stylebot.selectedElement = null;
        stylebot.destroySelectionBox();
        detachKeyboardShortcuts();
		// sync styles
		if (stylebot.options.sync === true) {
			stylebot.chrome.pushStyles();
		}
    },
    
    highlight: function(el) {
        if (!stylebot.selectionBox)
            stylebot.createSelectionBox();

        stylebot.hoveredElement = el;
        stylebot.selectionBox.highlight(el);
    },
    
    unhighlight: function() {
        stylebot.hoveredElement = null;
        if (stylebot.selectionBox)
            stylebot.selectionBox.hide();
    },
    
    // called when user selects an element
    select: function(el, selector) {
        stylebot.disableSelection();
        // preference is given to element over selector
        if (el)
        {
            stylebot.selectedElement = el;
            selector = SelectorGenerator.generate(el);
            stylebot.highlight(el);
        }
        else if (selector)
        {
            try {
                el = $(selector).get(0);
                stylebot.selectedElement = el;
                stylebot.highlight(el);
            }
            catch(e) {
                stylebot.selectedElement = null;
            }
        }
        else
        {
            stylebot.selectedElement = stylebot.hoveredElement;
            selector = SelectorGenerator.generate(stylebot.selectedElement);
        }
        stylebot.style.fillCache(selector);
        stylebot.widget.open();
        setTimeout(function() {
            stylebot.style.removeFromStyleElement();
        }, 100);
    },
    
    toggleSelection: function() {
        if (stylebot.selectionStatus)
        {
            stylebot.select(null, stylebot.style.cache.selector);
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
        stylebot.attachListeners();
        stylebot.selectionStatus = true;
        stylebot.widget.cache.headerSelectIcon
        .addClass('stylebot-select-icon-active')
        .attr('title', 'Click to disable selection of element');
    },
    
    disableSelection: function() {
        stylebot.detachListeners();
        stylebot.selectionStatus = false;
        stylebot.widget.cache.headerSelectIcon
        .removeClass('stylebot-select-icon-active')
        .attr('title', 'Click to enable selection of element');
    },
    
    createSelectionBox: function() {
        stylebot.selectionBox = new SelectionBox(2, "stylebot-selection");
    },
    
    destroySelectionBox: function() {
        if (stylebot.selectionBox)
        {
            stylebot.selectionBox.destroy();
            delete stylebot.selectionBox;
        }
    },
    
    attachListeners: function() {
        document.addEventListener('mousemove', this.onMouseMove, true);
        document.addEventListener('mousedown', this.onMouseDown, true);
        document.addEventListener('click', this.onMouseClick, true);
    },
    
    detachListeners: function() {
        document.removeEventListener('mousemove', this.onMouseMove, true);
        document.removeEventListener('mousedown', this.onMouseDown, true);
    },
    
    detachClickListener: function() {
        // We have to remove the click listener in a second phase because if we remove it
        // after the mousedown, we won't be able to cancel clicked links
        // thanks to firebug
        document.removeEventListener('click', this.onMouseClick, true);
    },
    
    onMouseMove: function(e) {
        // for dropdown
        if (e.target.className == "stylebot-dropdown-li") {
            var $el = $(e.target.innerText).get(0);
            if ($el != stylebot.hoveredElement) {
                stylebot.highlight($el);
            }
            return true;
        }
        if (!stylebot.shouldSelect(e.target))
            return true;
        if(stylebot.belongsToStylebot(e.target)) {
            stylebot.unhighlight();
            return true;
        }
        e.preventDefault();
        e.stopPropagation();
        stylebot.highlight(e.target);
    },

    onMouseDown: function(e) {
        if (!stylebot.belongsToStylebot(e.target))
        {
            e.preventDefault();
            e.stopPropagation();
            stylebot.select();
            return false;
        }
    },
    
    onMouseClick: function(e) {
        if (!stylebot.belongsToStylebot(e.target))
        {
            e.preventDefault();
            e.stopPropagation();
            stylebot.detachClickListener();
            return false;
        }
    },
    
    belongsToStylebot: function(el) {
        var $el = $(el);
        var parent = $el.closest('#stylebot, .stylebot_colorpicker, #stylebot-modal');
        var id = $el.attr('id');
        if (parent.length != 0 || id.indexOf("stylebot") != -1)
            return true;
        return false;
    },
    
    shouldClose: function(el) {
        if (!stylebot.status ||
            stylebot.widget.basic.isColorPickerVisible ||
            stylebot.isKeyboardHelpVisible ||
            stylebot.page.isVisible ||
            $("#stylebot-dropdown").length != 0 ||
            el.tagName === 'SELECT')
        {
            return false;
        }
        return true;
    },
    
    shouldSelect: function(el) {
        if (el.className === "stylebot-selection"
            || stylebot.widget.isBeingDragged
            || stylebot.page.isVisible
            || stylebot.isKeyboardHelpVisible
            || stylebot.hoveredElement === el
            )
        {
            return false;
        }
        return true;
    }
}