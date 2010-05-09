/* Code for Stylebot Widget */

Stylebot.Widget = {
    box: null,
    isBeingDragged:false,
    selector: null,
    create: function(){
        this.box = $('<div/>', {
            id:'stylebot'
        });
        /* Headers */
        $('<div class="stylebot-header">Custom Styles</div>').appendTo(this.box);
        
        var controls = $('<ul class="stylebot-controls" id="stylebot-styles"></ul>');

        /* creating the controls for different CSS properties */
        this.createControl('Color', 'color').appendTo(controls);
        this.createControl('Background Color', 'background-color').appendTo(controls);
        this.createControl('Font Size', 'font-size').appendTo(controls);
        this.createControl('Hide Element', 'display').appendTo(controls);
        
        controls.appendTo(this.box);
        
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
        var el = $('<li id="stylebot-'+property+'" class="stylebot-control"></li>');
        $('<label class="stylebot-label">'+text+':</label>').appendTo(el);
        this.createControlToolSet(property, el);
        return el;
    },
    createControlToolSet: function(property, el){
        var set = $('<div class="stylebot-control-toolset"></div>');
        var tool = null;
        
        /* Property specific tools to add to control set */
        switch(property){
            case 'font-size':
                tool = $('<input type="text" class="stylebot-textfield stylebot-tool" size="4" />');
                break;
            case 'color':
                tool = $('<input type="text" class="stylebot-textfield stylebot-tool" size="10" />');
                break;
            case 'background-color':
                tool = $('<input type="text" class="stylebot-textfield stylebot-tool" size="10" />');
                break;
            case 'display':
                tool = $('<input type="checkbox" class="stylebot-tool stylebot-checkbox" value="none"/>');
                break;
        }
        if(tool)
            tool.appendTo(set);

        set.appendTo(el);
    },
    showControlToolSet: function(e){
        if(e.target.className != 'stylebot-button')
        {
            $('.stylebot-control-toolset').hide();
            var set = $($(this).children('div')[0]);
            set.show();
            var tool = set.children('.stylebot-tool')[0];
            if(tool)
                tool.focus();
        }
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
        $('.stylebot-textfield').keyup(function(e){
            /* if esc is pressed, take away focus from textfield. */
            if(e.keyCode == 27)
            {
                e.target.blur();
                return true;
            }
            
            var value = e.target.value;
            
            var property = $(e.target).closest('.stylebot-control').attr('id').substring(9);
            switch(property){
                case 'font-size':
                    value += 'px';
                    break;
            }
            Stylebot.Style.apply( Stylebot.Widget.selector, property, value);
        });
        
        $('.stylebot-checkbox').click(function(e){
            var value;
            if(e.target.checked == true)
                value = e.target.value;
            else
                value = '';
            var property = $(e.target).closest('.stylebot-control').attr('id').substring(9);
            Stylebot.Style.apply( Stylebot.Widget.selector, property, value);
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
        this.reset();
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
        var styles = Stylebot.Style.getProperties(this.selector);
        if(styles)
        {
            var len = styles.length;
            for(var i=0; i<len; i++)
                this.fillControl(styles[i].property, styles[i].value);
        }
    },
    reset: function(){
        /* clear all fields */
        $('.stylebot-textfield').attr("value","");
        $('.stylebot-checkbox').attr('checked', false);
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
            
            console.log("Box Width: "+this.box.width() + "\nLeft: " + left + "\nLeft Diff: " + leftDiff);
            console.log("Box Height: " + this.box.height() + "\nTop: " + top + "\nTop Diff: " + topDiff);
        }
    },
    save: function(e){
        Stylebot.Style.save();
    },
    generateCSS: function(e){
        Stylebot.Style.crunchCSS();
    },
    getControl: function(property){
        return $('#stylebot-' + property);
    },
    fillControl: function(property, value){
        var control = this.getControl(property);
        switch(property)
        {
            case "color"            :   
            case "background-color" :   
            case "font-size"        :   control.find('.stylebot-textfield')[0].value = value;
                                        break;
            case "display"          :   var checkbox = control.find('.stylebot-checkbox');
                                        if(value == 'none')
                                            checbox.checked = true;
                                        else
                                            checkbox.checked = false;
                                        break;
        }
    }
}