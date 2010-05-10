/* Code for the Stylebot Modal Window */

Stylebot.Modal = {
    box: null,
    create: function(){
        
    },
    addListeners: function(){
        
    },
    fill: function(content){
        
    },
    show: function(content){
        if(!this.box)
            this.create();
        this.box.fill(content);
        this.box.fadeIn(300);
    },
    hide: function(){
        this.box.fadeOut(300);
    }
}