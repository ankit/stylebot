/* Code for Stylebot Widget */

Stylebot.Widget = {
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
            this.createControl(this.controls[i].name, this.controls[i].property).appendTo(controls_ui);
        
        controls_ui.appendTo(this.box);
        
        var buttons = $('<div id="stylebot-main-buttons"></div>');
        $('<button class="stylebot-button" style=""> Save changes</button>').appendTo(buttons).click(Stylebot.Widget.save);
        $('<button class="stylebot-button" style=""> Generate CSS</button>').appendTo(buttons).click(Stylebot.Widget.generateCSS);
        buttons.appendTo(this.box);

        $(document.body).append(this.box);
        
        /* Make widget draggable */
        this.box.draggable({
            start: function(e, ui){ Stylebot.Widget.isBeingDragged = true; },
            stop: function(e, ui){ Stylebot.Widget.isBeingDragged = false; }
        });

        this.addListeners();
    },
    createControl: function(text, property){
        var el = $('<li class="stylebot-control"></li>');
        $('<label class="stylebot-label">'+text+':</label>').appendTo(el);
        
        /* Property specific tools to add to control set */
        switch(property){
            case 'font-size': 
                this.createTextfield(property, 4).appendTo(el);el.html(el.html() + " px");
                break;
            case 'color':
                this.createTextfield(property, 10).appendTo(el);
                break;
            case 'background-color':
                this.createTextfield(property, 10).appendTo(el);
                break;
            case 'display':
                this.createCheckbox(null, property, 'none').appendTo(el);
                break;
            case 'style':
                // this.createCheckbox("<b>Bold</b>", 'font-weight', 'bold').appendTo(el);
                // this.createCheckbox("<i>Italic</i>", 'font-style', 'italic').appendTo(el);
                this.createRadio("<b>B</b>", "style", ['font-weight','font-style'], ['bold', 'none']).appendTo(el);
                this.createRadio("<i>i</i>", "style", ['font-weight','font-style'], ['none', 'italic']).appendTo(el);
                this.createRadio("<b>B</b> + <i>i</i>", "style", ['font-weight','font-style'], ['bold','italic']).appendTo(el);
                this.createRadio("None", "style", ['font-weight','font-style'], ['normal','none']).appendTo(el);
                break;
            case 'text-decoration':
                this.createRadio("<u>underline</u>", property, property, 'underline').appendTo(el);
                this.createRadio("None", property, property, 'none').appendTo(el);
                break;
        }
        return el;
    },
    createTextfield: function(property, size){
        return $('<input type="text" class="stylebot-textfield stylebot-tool" stylebot-property="'+ property +'" size="'+ size +'" />');
    },
    createCheckbox: function(text, property, value){
        var checkbox = $('<input type="checkbox" class="stylebot-tool stylebot-checkbox" stylebot-property="'+ property +'" value="'+ value +'"/> ');
        if(text)
        {
            var span = $('<span class="stylebot-tool"></span>');
            checkbox.appendTo(span);
            $('<label class="stylebot-inline-label">'+text+'</label>').appendTo(span);
            return span;
        }
        else
            return checkbox;
    },
    createRadio: function(text, name, property, value){
        var span = $('<span class="stylebot-tool"></span>');
        var radio;
        if(typeof(property) == 'string')
            radio = $('<input type="radio" name = "'+ name +'" class="stylebot-tool stylebot-radio" stylebot-property="'+ property +'" value="'+ value +'"/> ');
        else
            radio = $('<input type="radio" name = "'+ name +'" class="stylebot-tool stylebot-radio" stylebot-property="'+ property.join(",") +'" value="'+ value.join(",") +'"/> ');
        radio.appendTo(span);
        $('<label class="stylebot-inline-label">'+text+'</label>').appendTo(span);
        return span;
    },
    addListeners: function(){
        this.box.mouseenter(function(e){
            if(Stylebot.isEditing)
                Stylebot.Widget.box.css('opacity','1.0');
        });
        this.box.mouseleave(function(e){
            if(Stylebot.isEditing)
                Stylebot.Widget.box.css('opacity','0.9');
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
            Stylebot.Style.apply(Stylebot.Widget.selector, property, value);
        });
        
        /* For checkboxes */
        $('.stylebot-checkbox').click(function(e){
            var value;
            if(e.target.checked == true)
                value = e.target.value;
            else
                value = '';
            var property = $(e.target).attr('stylebot-property');
            Stylebot.Style.apply( Stylebot.Widget.selector, property, value);
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
                Stylebot.Style.apply( Stylebot.Widget.selector, properties[i], values[i]);
        });
        
    },
    show: function(){
        Stylebot.isEditing = true;
        this.selector = Stylebot.Selector.value;
        /* if DOM element for widget does not exist, create it */
        if(!this.box)
            this.create();

        /* decide where the widget should be displayed with respect to selected element */
        this.setPosition();
        this.reset(); //clear all values for controls
        this.fill(); //fill with any existing custom styles
        this.box.fadeIn(200);
        
        setTimeout(function(){
            $('.stylebot-tool')[0].focus();
        }, 0);
    },
    hide: function(){
        Stylebot.isEditing = false;
        this.box.fadeOut(200);
    },
    fill: function(){
        var len = this.controls.length;
        var styles = Stylebot.Style.getStyles(this.selector);
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
        if(Stylebot.selectedElement)
        {
            /* Left offset of widget */
            var offset = Stylebot.selectedElement.offset();
            var left = offset.left + Stylebot.selectedElement.width() + 10;
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
        Stylebot.Style.save();
    },
    generateCSS: function(e){
        alert(Stylebot.Style.crunchCSS());
        // Stylebot.Modal.show(Stylebot.Style.crunchCSS());
    },
    getControl: function(property){
        return $('[stylebot-property=' + property + ']');
    },
    fillControl: function(control, styles){
        /* TODO: Clean this mess up! */
        switch(control){
            case 'color'            :   
            case 'background-color' :   
            case 'font-size'        :   var index = Stylebot.Style.search(styles, "property", control);
                                        if(index != null)
                                        {
                                            var value = styles[index].value;
                                            this.getControl(control).attr('value', value);
                                        }
                                        break;
            case 'display'          :   var index = Stylebot.Style.search(styles, "property", control);
                                        if(index != null)
                                        {
                                            if(styles[index].value == 'none')
                                                this.getControl(control).attr('checked', true);
                                            else
                                                this.getControl(control).attr('checked', false);                                            
                                        }
                                        break;
            case 'text-decoration'  :   var index = Stylebot.Style.search(styles, "property", "text-decoration");
                                        if(index != null){
                                            if(styles[index].value == 'underline')
                                                this.getControl(control)[0].checked = true;
                                            else
                                                this.getControl(control)[1].checked = true;
                                        }
            case 'style'            :   var index = Stylebot.Style.search(styles, "property", "font-weight");
                                        var index2 = Stylebot.Style.search(styles, "property", "font-style");
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