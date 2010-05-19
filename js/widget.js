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
        this.box = $('<div/>', {
            id:'stylebot'
        });
        /* Headers */
        $('<div class="stylebot-header">Custom Styles</div>').appendTo(this.box);
        
        var controls_ui = $('<ul class="stylebot-controls" id="stylebot-styles"></ul>');

        /* creating the controls for different CSS properties */
        var len = this.controls.length;
        
        for(var i=0; i<len; i++)
            this.ui.createControl(this.controls[i]).appendTo(controls_ui);
        
        controls_ui.appendTo(this.box);
        
        var buttons = $('<div id="stylebot-main-buttons"></div>');
        $('<button class="stylebot-button" style=""> Save changes</button>').appendTo(buttons).click(stylebot.widget.save);
        $('<button class="stylebot-button" style=""> Generate CSS</button>').appendTo(buttons).click(stylebot.widget.generateCSS);
        buttons.appendTo(this.box);

        $(document.body).append(this.box);
        
        /* Make widget draggable */
        this.box.draggable({
            start: function(e, ui){ stylebot.widget.isBeingDragged = true; },
            stop: function(e, ui){ stylebot.widget.isBeingDragged = false; }
        });

        this.addListeners();
    },
    addListeners: function(){
        this.box.mouseenter(function(e){
            if(stylebot.isEditing)
                stylebot.widget.box.animate({
                    opacity:1
                });
        });
        this.box.mouseleave(function(e){
            if(stylebot.isEditing)
                stylebot.widget.box.animate({
                    opacity:0.9
                });
        });
    },
    show: function(){
        stylebot.isEditing = true;
        this.selector = stylebot.selector.value;
        
        if(!this.box)           //if DOM element for widget does not exist, create it
            this.create();

        this.setPosition();     //decide where the widget should be displayed with respect to selected element
        this.reset();           //clear all values for controls
        this.fill();            //fill widget with any existing custom styles
        this.box.fadeIn(200);
        
        setTimeout(function(){
            $('.stylebot-tool')[0].focus();
        }, 0);
    },
    hide: function(){
        stylebot.isEditing = false;
        this.box.fadeOut(200);
    },
    fill: function(){
        var len = this.controls.length;
        var styles = stylebot.style.getStyles(this.selector);
        
        if(styles)
        {
            for(var i=0; i<len; i++)
            {
                this.ui.fillControl(this.controls[i], styles);
            }
        }
    },
    reset: function(){
        /* clear all fields */
        $('.stylebot-textfield').attr('value', '');
        $('.stylebot-checkbox').attr('checked', false);
        $('.stylebot-radio').attr('checked', false);
        $('.stylebot-select').attr('selectedIndex', 0);
    },
    setPosition: function(){
        if(stylebot.selectedElement)
        {
            /* Left offset of widget */
            var offset = stylebot.selectedElement.offset();
            var left = offset.left + stylebot.selectedElement.width() + 10;
            var leftDiff = this.box.width() - (document.body.clientWidth - left);
            if(leftDiff >= 0)
                left = left - leftDiff;
            
            /* Top offset of widget */
            var top = offset.top - window.pageYOffset;
            /* in case the element's top is beyond current view */
            if(top < 0)
                top = window.pageYOffset - 300;
            else
            {
                var topDiff = window.innerHeight - (top + this.box.height() + 100);
                if(topDiff <= 0)
                    top = top + topDiff;
            }
            
            this.box.css('left', left);
            this.box.css('top', top);
            
            console.log("Box Width: "+ this.box.width() + "\nLeft: " + left + "\nLeft Diff: " + leftDiff);
            console.log("Box Height: " + this.box.height() + "\nTop: " + top + "\nTop Diff: " + topDiff);
        }
    },
    save: function(e){
        stylebot.style.save();
    },
    generateCSS: function(e){
        alert(stylebot.style.crunchCSS());
        // stylebot.modal.show(stylebot.style.crunchCSS());
    }
}