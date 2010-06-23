/**
  * stylebot.widget
  *
  * Stylebot Widget
  **/

stylebot.widget = {
    
    selector: null,
    
    isBeingDragged: false,
    
    mode: 'Basic',
    
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
    },
    
    show: function() {
        this.selector = stylebot.selector.value;
        if(!this.ui.cache.box)
            this.create();
        
        if(this.mode == "Basic")
            this.ui.showBasic();
        else
            this.advanced.show();
        
        // set widget title
        this.ui.cache.header.html(stylebot.selector.value ? stylebot.selector.value : "Select an element");
        stylebot.widget.ui.cache.box.show();
    },
    
    hide: function() {
        this.ui.cache.box.hide();
    },
    
    // calculate where the widget should be displayed w.r.t selected element
    setPosition: function(where) {
        var dialogWidth = 300;
        var left;

        if(where == 'Left')
            left = 50;
        else if(where == 'Right')
            left = document.body.clientWidth - dialogWidth - 50;

        this.ui.cache.box.css('left', left);
    },
    
    setMode: function(mode) {
        stylebot.widget.mode = mode;
        if(mode == 'Advanced')
        {
            stylebot.widget.ui.hideBasic();
            stylebot.widget.advanced.show();
        }
        else
        {
            stylebot.widget.advanced.hide();
            stylebot.widget.ui.showBasic();
        }
    },
    
    save: function(e) {
        stylebot.style.save();
    },
    
    viewCSS: function(e) {
        stylebot.modal.show(stylebot.style.crunchCSS(), {
            onClose: function() { e.target.focus(); }
        });
    },
    
    // reset css for current selector
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
    
    updateRuleCache: function(e) {
        if(stylebot.widget.mode == "Basic")
            stylebot.widget.ui.updateRuleCache();
        else
            stylebot.widget.advanced.updateRuleCache();
    }
}