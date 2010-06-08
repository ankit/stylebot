/**
  * stylebot.widget
  *
  * Stylebot Widget
  **/

stylebot.widget = {
    
    selector: null,
    
    isBeingDragged:false,
    
    create: function(){
        this.ui.createBox();
        this.addListeners();
    },
    
    addListeners: function(){
        
        this.ui.cache.dialog.mouseenter(function(e){
            if(stylebot.isEditing && !stylebot.widget.isBeingDragged)
                $(this).animate({
                    opacity:1
                });
        });
        
        this.ui.cache.dialog.mouseleave(function(e){
            if(stylebot.isEditing && !stylebot.widget.isBeingDragged)
                $(this).animate({
                    opacity:0.9
                });
        });
        
        
        // TODO: Instead of having these two handlers, implement them into the document 'keyup' handler
        this.ui.cache.dialog.keyup(function(e){
            // disable editing on esc
            if(e.keyCode == 27 && !stylebot.widget.ui.isColorPickerVisible)
            {
                console.log("Escape handler for Dialog triggered");
                e.target.blur();
                stylebot.disable();
            }
        });
        
        this.ui.cache.controls.keyup(function(e){
            // if esc is pressed, take away focus and stop editing
            if(e.keyCode == 27 && !stylebot.widget.ui.isColorPickerVisible)
            {
                console.log("Escape handler for Control triggered");
                e.target.blur();
                stylebot.disable();
            }
        });
    },
    
    show: function(){
        stylebot.isEditing = true;
        this.selector = stylebot.selector.value;
        
        if(!this.ui.cache.box)
            this.create();

        this.ui.reset();            // reset all values for controls to default values
        this.ui.fill();             // fill widget with any existing custom styles

        this.ui.cache.box.dialog('open');

        setTimeout(function(){
            stylebot.widget.ui.cache.controls[0].focus(); //set focus to first control in widget
        }, 0);
    },
    
    hide: function(){
        this.ui.cache.box.dialog('close');
    },
    
    // calculate where the widget should be displayed w.r.t selected element
    setPosition: function(where){
        var dialogWidth = stylebot.widget.ui.cache.box.dialog('option', 'width');
        var left;

        if(where == 'Left')
            left = 20;
        else if(where == 'Right')
            left = document.body.clientWidth - dialogWidth - 20;

        this.ui.cache.box.dialog('option', 'position', [left, null]);
    },
    
    save: function(e){
        stylebot.style.save();
    },
    
    generateCSS: function(e){
        stylebot.modal.show(stylebot.style.crunchCSS());
    }
}