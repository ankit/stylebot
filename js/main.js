/**
  * stylebot
  * Source: http://github.com/ankit/stylebot
  *
  * Copyright (c) 2010 Ankit Ahuja
  * Dual licensed under GPL and MIT licenses.
 **/

$(document).ready(function(){
    stylebot.init();
});

var stylebot = {
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
    
    // toggle stylebot editing status
    toggle: function(){
        if(this.status == true)
            this.disable();
        else
            this.enable();
    },
    
    enable: function(){
        this.status = true;
        // Add stylebot-ui class to body, so that jquery-ui theme is applied to widget
        $(document.body).addClass('stylebot-ui');
        stylebot.chrome.setIcon(true);
        stylebot.widget.show();
    },
    
    disable: function(){
        this.status = false;
        $(document.body).removeClass('stylebot-ui');
        this.unhighlight();
        this.selectedElement = null;
        stylebot.chrome.setIcon(false);
        stylebot.widget.hide();
    },
    
    addListeners: function(){
        /* Handle key presses */
        $(document).keyup(function(e){
            var eTagName = e.target.tagName;
            if(eTagName == 'INPUT' || eTagName == 'TEXTAREA' || eTagName == 'DIV' || eTagName == 'OBJECT')
               return true;
            
            /* Handle shortcut key 'e' to toggle editing mode */
            if(e.keyCode == stylebot.defaults.shortcutKey)
                stylebot.toggle();

            /* Handle Esc key to escape editing mode */
            else if(e.keyCode == 27 && stylebot.status)
                stylebot.disable();
        });
        
        /* Handle mouse move event on DOM elements */
        $(document).mousemove(function(e){
            if(stylebot.widget.isBeingDragged)
                return true;
            if(stylebot.hoveredElement == $(e.target) || !stylebot.status)
                return true;

            var parent = $(e.target).closest('.ui-dialog');
            var id = $(e.target).attr('id');
            if(id.indexOf("stylebot") != -1 || parent.length != 0)
            {
                stylebot.unhighlight();
                return true;
            }
            stylebot.highlight(e.target);
        });
        
        /* Handle click event on DOM elements */
        $(document).click(function(e){
            if(stylebot.hoveredElement && stylebot.status)
            {
                e.preventDefault();
                e.stopImmediatePropagation();
                stylebot.select();
                return false;
            }
        });
    },
    
    highlight: function(el){
        if(stylebot.hoveredElement)
            stylebot.hoveredElement.removeClass('stylebot-selected');
        stylebot.hoveredElement = $(el);
        stylebot.hoveredElement.addClass('stylebot-selected');
    },
    
    unhighlight: function(){
        if(stylebot.hoveredElement)
            stylebot.hoveredElement.removeClass('stylebot-selected');
        stylebot.hoveredElement = null;
    },
    
    select: function(){
        stylebot.selectedElement = stylebot.hoveredElement;
        stylebot.unhighlight();
        stylebot.selector.generate(stylebot.selectedElement);
        stylebot.widget.show();
    }
}