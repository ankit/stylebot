/**
  * stylebot.modal
  * 
  * Modal window used by Stylebot
  **/

stylebot.modal = {
    
    box: null,

    // create the DOM elements
    create: function(){
        this.box = $('<div>', {
            id:'stylebot-modal'
        });
        
        $('<div>', {
            html: "You can now copy the CSS below into the custom stylesheet for Chrome",
            style: "padding-bottom:10px"
        }).appendTo(this.box);
        
        $('<textarea>', {
            height:180,
            width:'98%',
            class:'stylebot-textarea stylebot-css-code'
        }).appendTo(this.box);

        this.box.appendTo(document.body).dialog({
            title: 'Generated CSS',
            modal: true,
            width:400,
            draggable:false,
            resizable:false,
            buttons: { "Copy to Clipboard": stylebot.modal.copyToClipboard }
        });
    },
    
    fill: function(content){
        this.box.find('textarea').html(content);
    },
    
    show: function(content){
        if(!this.box)
            this.create();
        this.fill(content);
        this.box.dialog('open');
    },
    
    hide: function(){
        this.box.dialog('close');
    },
    
    copyToClipboard: function(){
        var text = stylebot.modal.box.find('textarea').attr('value');
        stylebot.chrome.copyToClipboard(text);
    }
}