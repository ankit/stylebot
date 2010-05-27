/**
  * stylebot.widget
  *
  * Stylebot Widget
  **/

stylebot.widget = {
    
    box: null,
    
    isBeingDragged:false,
    
    selector: null,
    
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
        this.box = $('<div>', {
            id:'stylebot'
        });
        
        var controls_ui = $('<ul>', {
            id: 'stylebot-controls'
        });

        /* creating the controls for different CSS properties */
        var len = this.controls.length;
        
        for(var i=0; i<len; i++)
            this.ui.createControl(this.controls[i]).appendTo(controls_ui);
        
        controls_ui.appendTo(this.box);
        
        var buttons = $('<div>', {
            id: 'stylebot-main-buttons'
        });
        
        this.ui.createButton('Save changes').appendTo(buttons).click(stylebot.widget.save);
        this.ui.createButton('Generate CSS').appendTo(buttons).click(stylebot.widget.generateCSS);
        buttons.appendTo(this.box);

        this.box.appendTo(document.body).dialog({
            title: 'Custom Styles',
            autoOpen: false,
            dragStart: function(e, ui){
                stylebot.widget.isBeingDragged = true;
            },
            dragStop: function(e, ui){
                stylebot.widget.isBeingDragged = false;
            },
            beforeOpen: function(e, ui){
                stylebot.isEditing = true;
            },
            beforeClose: function(e, ui){
                stylebot.isEditing = false;
            }
        });
        // this.box.dialog('widget').css('position', 'fixed');
        this.addListeners();
    },
    
    addListeners: function(){
        this.box.dialog('widget').mouseenter(function(e){
            if(stylebot.isEditing)
                $(this).animate({
                    opacity:1
                });
        });
        this.box.dialog('widget').mouseleave(function(e){
            if(stylebot.isEditing)
                $(this).animate({
                    opacity:0.9
                });
        });
    },
    
    show: function(){
        stylebot.isEditing = true;
        this.selector = stylebot.selector.value;
        
        if(!this.box)
            this.create();

        this.setPosition();     // decide where the widget should be displayed with respect to selected element
        this.reset();           // reset all values for controls
        this.fill();            // fill widget with any existing custom styles

        this.box.dialog('open');

        setTimeout(function(){
            $('.stylebot-control')[0].focus(); //set focus to first control in widget
        }, 0);
    },
    
    hide: function(){
        this.box.dialog('close');
    },
    
    fill: function(){
        var len = this.controls.length;
        var styles = stylebot.style.getStyles(this.selector);
        
        if(styles)
        {
            for(var i=0; i<len; i++)
                this.ui.fillControl(this.controls[i], styles);
        }
    },
    
    // reset values to default for all controls
    reset: function(){
        $('.stylebot-textfield').attr('value', '');
        $('.stylebot-checkbox').attr('checked', false);
        $('.stylebot-radio').attr('checked', false);
        $('.stylebot-select').attr('selectedIndex', 0);
    },
    
    // calculate where the widget should be displayed w.r.t selected element
    setPosition: function(){
        if(stylebot.selectedElement)
        {
            /* Left offset of widget */
            var offset = stylebot.selectedElement.offset();
            var left = offset.left + stylebot.selectedElement.width() + 10;
            var leftDiff = this.box.dialog('option','width') - (document.body.clientWidth - left);
            if(leftDiff >= 0)
                left = left - leftDiff;
            
            /* Top offset of widget */
            var top = offset.top - window.pageYOffset;
            /* in case the element's top is beyond current view */
            if(top < 0)
                top = window.pageYOffset - 300;
            else
            {
                var topDiff = window.innerHeight - (top + this.box.dialog('option','height') + 100);
                if(topDiff <= 0)
                    top = top + topDiff;
            }
            
            this.box.dialog('option', 'position', [left, top]);
            
            console.log("Box Width: "+ this.box.width() + "\nLeft: " + left + "\nLeft Diff: " + leftDiff);
            console.log("Box Height: " + this.box.height() + "\nTop: " + top + "\nTop Diff: " + topDiff);
        }
    },
    
    save: function(e){
        stylebot.style.save();
    },
    
    generateCSS: function(e){
        stylebot.modal.show(stylebot.style.crunchCSS());
    }
}