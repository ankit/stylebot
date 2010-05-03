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
        
        $('<button class="stylebot-button stylebot-main-button"> Save</button>').appendTo(this.box);
        $('<button class="stylebot-button stylebot-main-button"> View CSS</button>').appendTo(this.box);
        
        $(document.body).append(Stylebot.Widget.box);
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
                set.children('.stylebot-tool')[0].focus();
            }
        });
    },
    show: function(){
        /* if DOM element for  does not exist, create it */
        if(!this.box)
        {
            this.create();
        }
        this.box.fadeIn();
    }
}