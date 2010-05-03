/* Code for Stylebot Widget */

Stylebot.Widget = {
    box: null,
    create: function(){
        this.box = $('<div/>', {
            id:'stylebot'
        });
        var controls = $('<ul class="stylebot-controls"></ul>');

        /* creating the controls for different CSS properties */
        this.createControl('Color', 'color').appendTo(controls);
        this.createControl('Background Color', 'background-color').appendTo(controls);
        this.createControl('Font Size', 'font-size').appendTo(controls);
        this.createControl('Hide Element', 'hide').appendTo(controls);
        
        controls.appendTo(this.box);
        
        $('<button class="stylebot-button stylebot-main-button"> View CSS</button>').appendTo(this.box);
        $('<button class="stylebot-button stylebot-main-button" style="float:right"> Cancel</button>').appendTo(this.box).click(function(e){Stylebot.Widget.hide();});
        $('<button class="stylebot-button stylebot-main-button" style="float:right"> Save</button>').appendTo(this.box);

        $(document.body).append(Stylebot.Widget.box);
        
        /* Make widget draggable */
        this.box.draggable();
        
        this.addListeners();
    },
    createControl: function(text, property){
        var el = $('<li id="stylebot-'+property+'" class="stylebot-control"></li>');
        $('<label class="stylebot-label">'+text+'</label>').appendTo(el);
        this.createControlSet(property, el);
        return el;
    },
    createControlSet: function(property, el){
        var set = $('<div class="stylebot-control-set"></div>');
        var tool = null;
        
        /* Property specific tools to add to control set */
        switch(property){
            case 'font-size':
                tool = $('<input type="text" class="stylebot-textfield stylebot-tool" size="4" />');
                break;
        }
        if(tool)
            tool.appendTo(set);
        
        /* Common UI elements for all control sets */
        $('<button class="stylebot-button"> add</button>').click(Stylebot.Widget.addStyle).appendTo(set);
        $('<button class="stylebot-button"> cancel</button>').click(function(e){ $(e.target).parent().hide();}).appendTo(set);
        set.appendTo(el);
        
        el.click(function(e){
            if(e.target.className != 'stylebot-button')
            {
                $('.stylebot-control-set').hide();
                var set = $($(this).children('div')[0]);
                set.show();
                var tool =  set.children('.stylebot-tool')[0];
                if(tool)
                    tool.focus();
            }
        });
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
        this.box.fadeOut(200);
    },
    setPosition: function(){
        var offset = Stylebot.selectedElement.offset();
        var left = offset.left + Stylebot.selectedElement.width() + 5;
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
}