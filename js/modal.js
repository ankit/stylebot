/**
  * stylebot.modal
  * 
  * Modal window used by Stylebot
  **/

stylebot.modal = {
    
    // cache of jQuery objects
    cache: {
        box: null,
        textarea: null
    },

    // create the DOM elements
    create: function(){
        this.cache.box = $('<div>', {
            id:'stylebot-modal'
        });
        
        $('<div>', {
            html: "You can now copy the CSS below into the custom stylesheet for Chrome",
            style: "padding-bottom:10px"
        })
        .appendTo(this.cache.box);
        
        this.cache.textarea = $('<textarea>', {
            height:300,
            width:'98%',
            class:'stylebot-textarea stylebot-css-code'
        })
        .appendTo(this.cache.box);

        this.cache.box.appendTo(document.body).dialog({
            title: 'Generated CSS',
            modal: true,
            width:'50%',
            height:450,
            draggable:false,
            resizable:false,
            buttons: { "Copy to Clipboard": stylebot.modal.copyToClipboard }
        });
    },
    
    fill: function(content){
        this.cache.box.find('textarea').html(content);
    },
    
    show: function(content){
        if(!this.cache.box)
            this.create();
        this.fill(content);
        this.cache.textarea.focus();
        this.cache.box.dialog('open');
    },
    
    hide: function(){
        this.cache.box.dialog('close');
    },
    
    copyToClipboard: function(){
        var text = stylebot.modal.cache.textarea.attr('value');
        stylebot.chrome.copyToClipboard(text);
    }
}