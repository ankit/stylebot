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
    isEditingElement:false,
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
        if(this.selectedElement)
        {
            this.selectedElement.removeClass('stylebot-selected');
            this.selectedElement = null;
            this.isEditingElement = false;
        }
        Stylebot.Chrome.setIcon(false);
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
            if(!Stylebot.isEditingElement && Stylebot.selectedElement != $(e.target) && Stylebot.status)
            {
                if(Stylebot.selectedElement)
                    Stylebot.selectedElement.removeClass('stylebot-selected');
                Stylebot.selectedElement = $(e.target);
                Stylebot.selectedElement.addClass('stylebot-selected');
            }
        });
        
        /* Handle click event on DOM elements */
        $(document).click(function(e){
            if(Stylebot.selectedElement && Stylebot.status)
            {
                e.preventDefault();
                Stylebot.isEditingElement = true;
                Stylebot.selectedElement.removeClass('stylebot-selected');
                Stylebot.Widget.show();
            }
        });
    }
}