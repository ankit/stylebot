/**
  * stylebot.modal
  * 
  * Modal window used by Stylebot
  **/

stylebot.modal = {
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