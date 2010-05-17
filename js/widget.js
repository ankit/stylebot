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
        property:'color'
    },
    {
        name:'Background Color', 
        property:'background-color'
    },
    {
        name:'Size', 
        property:'font-size'
    },
    {
        name:'Style', 
        property:'style'
    },
    {
        name:'Decoration', 
        property:'text-decoration'
    },
    {
        name:'Hide Element', 
        property:'display'
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
            this.ui.createControl(this.controls[i].name, this.controls[i].property).appendTo(controls_ui);
        
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
        
        /* listeners to update styles of DOM elements when value of widget controls is changed */
        
        /* For textfields */
        $('.stylebot-textfield').keyup(function(e){
            /* if esc is pressed, take away focus from textfield. */
            if(e.keyCode == 27)
            {
                e.target.blur();
                return true;
            }
            
            var value = e.target.value;
            
            var property = $(e.target).attr('stylebot-property');
            switch(property){
                case 'font-size':
                    value += 'px';
                    break;
            }
            stylebot.style.apply(stylebot.widget.selector, property, value);
        });
        
        /* For checkboxes */
        $('.stylebot-checkbox').click(function(e){
            var value;
            if(e.target.checked == true)
                value = e.target.value;
            else
                value = '';
            var property = $(e.target).attr('stylebot-property');
            stylebot.style.apply( stylebot.widget.selector, property, value);
        });
        
        /* For radios */
        $('.stylebot-radio').click(function(e){
            var value;
            if(e.target.checked == true)
                value = e.target.value;
            else
                value = '';
            var properties = $(e.target).attr('stylebot-property').split(',');
            var len = properties.length;
            var values = $(e.target).attr('value').split(',');
            for(var i=0; i<len; i++)
                stylebot.style.apply( stylebot.widget.selector, properties[i], values[i]);
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
                this.fillControl(this.controls[i].property, styles);
            }
        }
    },
    reset: function(){
        /* clear all fields */
        $('.stylebot-textfield').attr('value', '');
        $('.stylebot-checkbox').attr('checked', false);
        $('.stylebot-radio').attr('checked', false);
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
    },
    getControl: function(property){
        return $('[stylebot-property=' + property + ']');
    },
    fillControl: function(property, styles){
        /* TODO: Take a less expensive approach here */
        switch(property){
            case 'color'            :   
            case 'background-color' :   
            case 'font-size'        :   var index = stylebot.utils.search(styles, "property", property);
                                        if(index != null)
                                        {
                                            var value = styles[index].value;
                                            this.getControl(property).attr('value', value);
                                        }
                                        break;
            case 'display'          :   var index = stylebot.utils.search(styles, "property", property);
                                        if(index != null)
                                        {
                                            if(styles[index].value == 'none')
                                                this.getControl(property).attr('checked', true);
                                            else
                                                this.getControl(property).attr('checked', false);                                            
                                        }
                                        break;
            case 'text-decoration'  :   var index = stylebot.utils.search(styles, "property", "text-decoration");
                                        if(index != null){
                                            if(styles[index].value == 'underline')
                                                this.getControl(property)[0].checked = true;
                                            else
                                                this.getControl(property)[1].checked = true;
                                        }
            case 'style'            :   var index = stylebot.utils.search(styles, "property", "font-weight");
                                        var index2 = stylebot.utils.search(styles, "property", "font-style");
                                        if(index != null)
                                        {
                                            var val = styles[index].value;
                                            var val2 = styles[index2].value;
                                            if(val == 'bold' && val2 == 'italic')
                                                this.getControl('font-weight,font-style')[2].checked = true;
                                            else if(val == 'bold')
                                                this.getControl('font-weight,font-style')[0].checked = true;
                                            else if(val2 == 'italic')
                                                this.getControl('font-weight,font-style')[1].checked = true;
                                            else
                                                this.getControl('font-weight,font-style')[3].checked = true;
                                        }
                                        
        }
    }
}