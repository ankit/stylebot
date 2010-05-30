/**
  * stylebot.widget
  *
  * Stylebot Widget
  **/

stylebot.widget = {
    
    selector: null,
    
    isBeingDragged:false,
    
    controls:[{
        name:'Color',
        id: 'color'
    },
    {
        name:'Background Color',
        id: 'background-color'
    },
    {
        name:'Size',
        id: 'font-size'
    },
    {
        name:'Style',
        id: 'style'
    },
    {
        name:'Decoration',
        id: 'text-decoration'
    },
    {
        name:'Hide Element',
        id: 'display'
    }],
    
    create: function(){
        this.ui.createBox();
        this.addListeners();
    },
    
    addListeners: function(){
        this.ui.cache.dialog.mouseenter(function(e){
            if(stylebot.isEditing)
                $(this).animate({
                    opacity:1
                });
        });
        this.ui.cache.dialog.mouseleave(function(e){
            if(stylebot.isEditing)
                $(this).animate({
                    opacity:0.9
                });
        });
        
        this.ui.cache.dialog.keyup(function(e){
            // disable editing on esc
            if(e.keyCode == 27)
            {
                e.preventDefault();
                this.blur();
                stylebot.disable();
            }
        });
        
        this.ui.cache.controls.keyup(function(e){
            // if esc is pressed, take away focus and stop editing
            if(e.keyCode == 27)
            {
                e.target.blur();
                stylebot.disable();
                return;
            }
        })
    },
    
    show: function(){
        stylebot.isEditing = true;
        this.selector = stylebot.selector.value;
        
        if(!this.ui.cache.box)
            this.create();

        this.setPosition();         // decide where the widget should be displayed with respect to selected element
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
    setPosition: function(){
        if(stylebot.selectedElement)
        {
            /* Left offset of widget */
            var offset = stylebot.selectedElement.offset();
            var left = offset.left + stylebot.selectedElement.width() + 10;
            var leftDiff = this.ui.cache.box.dialog('option','width') - (document.body.clientWidth - left);
            if(leftDiff >= 0)
                left = left - leftDiff;
            
            /* Top offset of widget */
            var top = offset.top - window.pageYOffset;
            /* in case the element's top is beyond current view */
            if(top < 0)
                top = window.pageYOffset - 300;
            else
            {
                var topDiff = window.innerHeight - (top + this.ui.cache.box.dialog('option','height') + 100);
                if(topDiff <= 0)
                    top = top + topDiff;
            }
            
            this.ui.cache.box.dialog('option', 'position', [left, top]);
            
            // console.log("Box Width: "+ this.ui.cache.box.width() + "\nLeft: " + left + "\nLeft Diff: " + leftDiff);
            // console.log("Box Height: " + this.ui.cache.box.height() + "\nTop: " + top + "\nTop Diff: " + topDiff);
        }
    },
    
    save: function(e){
        stylebot.style.save();
    },
    
    generateCSS: function(e){
        stylebot.modal.show(stylebot.style.crunchCSS());
    }
}