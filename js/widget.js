/* Code for Stylebot Widget */

Stylebot.Widget = {
    box: null,
    isBeingDragged:false,
    create: function(){
        this.box = $('<div/>', {
            id:'stylebot'
        });
        /* Headers */
        $('<div class="stylebot-header">Add styles</div>').appendTo(this.box);
        
        var controls = $('<ul class="stylebot-controls" id="stylebot-styles"></ul>');

        /* creating the controls for different CSS properties */
        this.createControl('Color', 'color').appendTo(controls);
        this.createControl('Background Color', 'background-color').appendTo(controls);
        this.createControl('Font Size', 'font-size').appendTo(controls);
        this.createControl('Hide Element', 'hide').appendTo(controls);
        
        controls.appendTo(this.box);
        
        $('<div class="stylebot-header">Applied styles</div>').appendTo(this.box);
        
        var applied_styles = $('<ul class="stylebot-controls" id="stylebot-added-styles"></ul>');
        
        applied_styles.appendTo(this.box);
        
        var buttons = $('<div id="stylebot-main-buttons"></div>');
        $('<button class="stylebot-button" style="float:left"> Save </button>').appendTo(buttons).click(Stylebot.Widget.save);
        $('<button class="stylebot-button" style="float:left"> Generate CSS</button>').appendTo(buttons).click(Stylebot.Widget.generateCSS);
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
        $('<label class="stylebot-label">'+text+'</label>').appendTo(el);
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
        }
        if(tool)
            tool.appendTo(set);
        
        /* Common UI elements for all control sets */
        $('<button class="stylebot-button"> add</button>').click(Stylebot.Widget.addStyle).appendTo(set);
        $('<button class="stylebot-button"> cancel</button>').click(Stylebot.Widget.cancelStyle).appendTo(set);
        set.appendTo(el);
        
        el.click(Stylebot.Widget.showControlToolSet);
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
            var value = e.target.value;
            var property = $(e.target).closest('.stylebot-control').attr('id').substring(9);
            console.log("Property: " + property);
            console.log("Value: " + value);
            switch(property){
                case 'font-size':
                    value += 'px';
                    break;
            }
            Stylebot.Style.apply(Stylebot.Selector.value, property, value);
        });
        
    },
    show: function(){
        Stylebot.isEditing = true;
        /* if DOM element for widget does not exist, create it */
        if(!this.box)
            this.create();

        /* decide where the widget should be displayed with respect to selected element */
        this.setPosition();
        this.box.fadeIn(200);
    },
    hide: function(){
        Stylebot.isEditing = false;
        this.reset();
        this.box.fadeOut(200);
    },
    reset: function(){
        
    },
    setPosition: function(){
        if(Stylebot.selectedElement)
        {
            var offset = Stylebot.selectedElement.offset();
            var left = offset.left + Stylebot.selectedElement.width() + 10;
            var left_diff = $(document.body).width() - left;
            if(left_diff <= this.box.width())
                left = left - left_diff;

            var top = offset.top - window.pageYOffset;
            var top_diff = window.innerHeight - top - 300;
            if(top_diff <= 0)
                top = top + top_diff;

            this.box.css('left', left);
            this.box.css('top', top);
        }
    },
    save: function(e){
        Stylebot.Style.save();
    },
    generateCSS: function(e){
        Stylebot.Style.crunchCSS();
    },
    addStyle: function(e){
        Stylebot.Style.addToList();
    },
    cancelStyle: function(e){
        $(e.target).parent().hide();
        Stylebot.Style.resetTemporaryCache();
    }
}