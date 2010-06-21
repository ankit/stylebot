/**
  * stylebot.widget
  *
  * Stylebot Widget
  **/

stylebot.widget = {
    
    selector: null,
    
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
    },
    
    show: function() {
        this.selector = stylebot.selector.value;
        if(!this.ui.cache.box)
            this.create();

        this.ui.reset();            // reset all values for controls to default values
        this.ui.fill();             // fill widget with any existing custom styles
        
        setTimeout(function() {
            stylebot.widget.ui.cache.accordionHeaders[0].focus();
        }, 0);
        
        this.ui.cache.box.show();
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
        // clear any custom styles for currently selected element
        stylebot.style.clear();
    },
    
    // reset all CSS for page
    resetAllCSS: function(e) {
        stylebot.widget.ui.reset();
        stylebot.style.clearAll();
    }
}