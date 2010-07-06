/**
  * An extremely minimalistic modal box
  *
  * Copyright (c) 2010 Ankit Ahuja
  * Dual licensed under GPL and MIT licenses.
 **/

// constructor
var ModalBox = function( html, options ) {
    this.box = $('<div>', {
        id:'stylebot-modal'
    })
    .append(html)
    .appendTo(document.body);
    
    // darken background
    this.background = $('<div>', {
        id: 'stylebot-background'
    })
    .appendTo(document.body);
    
    if( options )
    {
        this.onClose = options.onClose;
        this.onOpen = options.onOpen;
    }
};
    
ModalBox.prototype.darkenBg = function(callback) {
        this.background.css({
            height: document.height
        });
        this.background.fadeIn(170);
}
    
ModalBox.prototype.show = function(content, options) {
    this.box.show();
    this.darkenBg();
    if(this.onOpen != undefined && this.onOpen)
        this.onOpen();
    var onKeyUp = function(e) {
        if(e.keyCode == 27)
        {
            e.preventDefault();
            e.data.modal.hide();
            $(document).unbind('keyup', onKeyUp);
            $(document).unbind('mousedown', onMouseDown);
        }
    }
    var onMouseDown = function(e) {
        var id = e.target.id;
        var parent = $(e.target).closest('#stylebot-modal');
        if(id != 'stylebot-modal' && parent.length == 0)
        {
            e.preventDefault();
            e.data.modal.hide();
            $(document).unbind('keyup', onKeyUp);
            $(document).unbind('mousedown', onMouseDown);
        }
    }
    $(document).bind( 'keyup', { modal: this }, onKeyUp );
    $(document).bind( 'mousedown', { modal: this }, onMouseDown );
}
    
ModalBox.prototype.hide = function() {
        this.box.hide();
        this.background.fadeOut(170);
        if(this.onClose && this.onClose != undefined)
            this.onClose();
}