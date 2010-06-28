/**
  * stylebot.widget
  *
  * Stylebot Widget
  **/

stylebot.widget = {
    
    isBeingDragged: false,
    
    create: function() {
        this.ui.createBox();
        this.addListeners();
    },
    
    addListeners: function() {
        
        // TODO: Instead of having these separate handlers, implement them into a single handler
        this.ui.cache.box.keydown(function(e) {
            // disable editing on esc
            if(e.keyCode == 27 && !stylebot.widget.ui.isColorPickerVisible)
            {
                e.target.blur();
                stylebot.disable();
            }
        });
        
        this.ui.cache.controls.keydown(function(e) {
            // if esc is pressed, take away focus and stop editing
            if(e.keyCode == 27 && !stylebot.widget.ui.isColorPickerVisible)
            {
                e.target.blur();
                stylebot.disable();
            }
        });
        
        // listen to window resize event to update position/dimension of widget
        $(window).resize( function(e) {
            stylebot.widget.setPosition(stylebot.options.position);
            stylebot.widget.updateHeight();
            if(stylebot.options.mode == 'Basic')
                stylebot.widget.ui.updateHeight();
            else
                stylebot.widget.advanced.updateHeight();
        });
    },
    
    show: function() {
        if(!this.ui.cache.box)
            this.create();
            
        this.setPosition(stylebot.options.position);
        this.updateHeight();
        
        // set widget title
        this.ui.cache.header.html(stylebot.selector.value ? stylebot.selector.value : "Select an element");
        
        if(stylebot.options.mode == "Basic")
            this.ui.show();
        else
            this.advanced.show();
        
        stylebot.widget.ui.cache.box.show();
    },
    
    hide: function() {
        this.ui.cache.box.hide();
    },
    
    setPosition: function(where) {
        var dialogWidth = 300;
        var left;

        if(where == 'Left')
            left = 20;
        else if(where == 'Right')
            left = window.innerWidth - dialogWidth - 70;

        this.ui.cache.box.css('left', left);
        
        stylebot.options.position = where;
    },
    
    updateHeight: function() {
        this.ui.cache.box.css('height', window.innerHeight - 20);
    },
    
    setMode: function(mode) {
        stylebot.options.mode = mode;
        if(mode == 'Advanced')
        {
            stylebot.widget.ui.hide();
            stylebot.widget.advanced.show();
        }
        else
        {
            stylebot.widget.advanced.updateRuleCache();
            stylebot.widget.advanced.hide();
            stylebot.widget.ui.show();
        }
    },
    
    save: function(e) {
        stylebot.widget.updateRuleCache();
        stylebot.style.save();
    },
    
    // display CSS for page in a modal box
    viewCSS: function(e) {
        stylebot.modal.show(stylebot.style.crunchCSS(), {
            onClose: function() { e.target.focus(); }
        });
    },
    
    // reset CSS for current selector
    resetCSS: function(e) {
        stylebot.widget.ui.reset();
        stylebot.widget.advanced.reset();
        // clear any custom styles for currently selected element
        stylebot.style.clear();
    },
    
    // reset all CSS for page
    resetAllCSS: function(e) {
        stylebot.widget.ui.reset();
        stylebot.widget.advanced.reset();
        stylebot.style.clearAll();
    },
    
    togglePosition: function(e) {
        var el = $(e.target);
        stylebot.widget.setPosition( el.html() );
        $("." + el.data('class')).removeClass('stylebot-active-button');
        el.addClass('stylebot-active-button');
    },
    
    toggleMode: function(e) {
        var el = $(e.target);
        stylebot.widget.setMode( el.html() );
        $("." + el.data('class')).removeClass('stylebot-active-button');
        el.addClass('stylebot-active-button');
    },
    
    toggleSpecificity: function(e) {
        var el = $(e.target);
        stylebot.selector.mode = el.html().toLowerCase();
        stylebot.selector.generate(stylebot.selectedElement);
        stylebot.style.fillCache(stylebot.selector.value);
        stylebot.widget.show();
        $("." + el.data('class')).removeClass('stylebot-active-button');
        el.addClass('stylebot-active-button');
    },
    
    updateRuleCache: function(e) {
        if(stylebot.options.mode == "Advanced")
            stylebot.widget.advanced.updateRuleCache();
    }
}