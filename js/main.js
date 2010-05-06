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
    defaults: {
        shortcutKey:69 //69 is keycode for 'e'
    },
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
        Stylebot.Widget.show();
    },
    disable: function(){
        this.status = false;
        this.unhighlight();
        this.selectedElement = null;
        Stylebot.Chrome.setIcon(false);
        Stylebot.Widget.hide();
    },
    addListeners: function(){
        /* Handle key presses */
        $(document).keyup(function(e){
            var eTagName = e.target.tagName;
            if(eTagName == 'INPUT' || eTagName == 'TEXTAREA' || eTagName == 'DIV')
               return true;
            /* Handle shortcut key 'e' to toggle editing mode */
            if(e.keyCode == Stylebot.defaults.shortcutKey)
                Stylebot.toggle();

            /* Handle Esc key to escape editing mode */
            else if(e.keyCode == 27 && Stylebot.status)
                Stylebot.disable();
        });
        
        /* Handle mouse move event on DOM elements */
        $(document).mousemove(function(e){
            if(Stylebot.Widget.isBeingDragged)
                return true;
            if(Stylebot.hoveredElement == $(e.target) || !Stylebot.status)
                return true;
            
            var parent = $(e.target).closest('#stylebot');
            if(e.target.id == "stylebot" || parent.length != 0)
            {
                Stylebot.unhighlight();
                return true;
            }
            Stylebot.highlight(e.target);
        });
        
        /* Handle click event on DOM elements */
        $(document).click(function(e){
            if(Stylebot.hoveredElement && Stylebot.status)
            {
                e.preventDefault();
                e.stopImmediatePropagation();
                Stylebot.select();
            }
        });
    },
    highlight: function(el){
        if(Stylebot.hoveredElement)
            Stylebot.hoveredElement.removeClass('stylebot-selected');
        Stylebot.hoveredElement = $(el);
        Stylebot.hoveredElement.addClass('stylebot-selected');
    },
    unhighlight: function(){
        if(Stylebot.hoveredElement)
            Stylebot.hoveredElement.removeClass('stylebot-selected');
        Stylebot.hoveredElement = null;
    },
    select: function(){
        Stylebot.selectedElement = Stylebot.hoveredElement;
        Stylebot.unhighlight();
        Stylebot.Selector.generate(Stylebot.selectedElement);
        Stylebot.Widget.show();
    }
}