/**
  * An extremely minimalistic modal box
  *
  * Copyright (c) 2010 Ankit Ahuja
  * Dual licensed under GPL and MIT licenses.
 **/

// constructor
var ModalBox = function( html, options ) {
    
    if( options )
    {
        for( var option in options )
            this.options[ option ] = options[ option ];
    }
    
    this.box = $('<div>', {
        id:'stylebot-modal'
    })
    .append(html)
    .appendTo(document.body);
    
    // darken background
    this.background = $('<div>', {
        id: 'stylebot-background',
    })
    .css('opacity', this.options.bgOpacity)
    .appendTo(document.body);
};

ModalBox.prototype.options = {
    bgOpacity: 0.7,
    bgFadeSpeed: 120,
    fadeSpeed: 0,
    onClose: function() {},
    onOpen: function() {}
}

ModalBox.prototype.darkenBg = function(callback) {
        this.background.css({
            height: document.height
        });
        this.background.fadeIn( this.options.bgFadeSpeed );
}
    
ModalBox.prototype.show = function(content, options) {
    this.box.fadeIn( this.options.fadeSpeed );
    this.darkenBg();
    this.options.onOpen();
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
        this.box.fadeOut( this.options.fadeSpeed );
        this.background.fadeOut( this.options.bgFadeSpeed );
        this.options.onClose();
}