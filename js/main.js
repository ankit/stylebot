/**
  * Stylebot
  * Copyright (c) 2010 Ankit Ahuja
  * Licensed under GPL. See LICENSE
 **/

$(document).ready(function(){
    Stylebot.init();
});

var Stylebot = {
    status: false,
    selectedElement:null,
    hoveredElement:null,
    isEditing:false,
    shortcutKey:69, //69 is keycode for 'e'

    init: function(){
        this.addListeners();
    },
    toggle: function(){
        if(this.status == true)
            this.disable();
        else
            this.enable();
    },
    enable: function(){
        this.status = true;
        Stylebot.Chrome.setIcon(true);
    },
    disable: function(){
        this.status = false;
        if(this.hoveredElement)
        {
            this.hoveredElement.removeClass('stylebot-selected');
            this.hoveredElement = null;
        }
        this.selectedElement = null;
        Stylebot.Chrome.setIcon(false);
        Stylebot.Widget.hide();
    },
    addListeners: function(){
        /* Handle key presses */
        $(document).keyup(function(e){
            if(e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA')
            {
                /* Handle shortcut key 'e' to toggle editing mode */
                if(e.keyCode == Stylebot.shortcutKey)
                {
                    Stylebot.toggle();
                }

                /* Handle Esc key to escape editing mode */
                else if(e.keyCode == 27 && Stylebot.status)
                    Stylebot.disable();
            }
        });
        
        /* Handle mouse move event on DOM elements */
        $(document).mousemove(function(e){
            if(Stylebot.hoveredElement == $(e.target) || !Stylebot.status)
                return true;
            var parent = $(e.target).closest('#stylebot');
            if(e.target.id == "stylebot" || parent.length != 0)
            {
                if(Stylebot.hoveredElement)
                    Stylebot.hoveredElement.removeClass('stylebot-selected');
                Stylebot.hoveredElement = null;
                return true;
            }
            if(Stylebot.hoveredElement)
                Stylebot.hoveredElement.removeClass('stylebot-selected');
            Stylebot.hoveredElement = $(e.target);
            Stylebot.hoveredElement.addClass('stylebot-selected');
        });
        
        /* Handle click event on DOM elements */
        $(document).click(function(e){
            if(Stylebot.hoveredElement && Stylebot.status)
            {
                e.preventDefault();
                e.stopPropagation();
                Stylebot.hoveredElement.removeClass('stylebot-selected');
                Stylebot.selectedElement = Stylebot.hoveredElement;
                Stylebot.hoveredElement = null;
                Stylebot.Widget.show();
            }
        });
    }
}