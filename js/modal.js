/**
  * stylebot.modal
  * 
  * Modal window used by Stylebot
  **/

stylebot.modal = {
    
    isVisible: false,
    
    // cache of jQuery objects
    cache: {
        box: null,
        textarea: null,
        background: null
    },

    // create the DOM elements
    create: function() {
        this.cache.box = $('<div>', {
            id:'stylebot-modal'
        })
        .appendTo(document.body);
        
        $('<div>', {
            html: "You can now copy the CSS below into the custom stylesheet for Chrome: "
        })
        .appendTo(this.cache.box);
        
        this.cache.textarea = $('<textarea>', {
            height: this.cache.box.height() * 0.8,
            width: '98%',
            class:'stylebot-textarea stylebot-css-code'
        })
        .appendTo(this.cache.box);

        stylebot.widget.ui.createButton( "Copy to Clipboard" )
        .click(stylebot.modal.copyToClipboard)
        .appendTo(this.cache.box);
        
        // darken background
        this.cache.background = $('<div>', {
            id: 'stylebot-background'
        })
        .appendTo(document.body);
    },
    
    fill: function(content) {
        this.cache.box.find('textarea').html(content);
    },
    
    darkenBg: function(callback) {
        this.cache.background.css({
            height: document.height
        });
        this.cache.background.fadeIn(170);
    },
    
    show: function(content) {
        if(!this.cache.box)
            this.create();
        this.fill(content);
        this.cache.box.show();
        this.darkenBg();
        this.cache.textarea.focus();
        this.isVisible = true;
        var onKeyDown = function(e) {
            if(e.keyCode == 27)
            {
                e.preventDefault();
                stylebot.modal.hide();
                $(document).unbind('keydown', onKeyDown);
                $(document).unbind('mousedown', onMouseDown);
            }
        }
        var onMouseDown = function(e) {
            var id = e.target.id;
            var parent = $(e.target).closest('#stylebot-modal');
            if(id != 'stylebot-modal' && parent.length == 0)
            {
                e.preventDefault();
                stylebot.modal.hide();
                $(document).unbind('keydown', onKeyDown);
                $(document).unbind('mousedown', onMouseDown);
            }
        }
        $(document).bind('keydown', onKeyDown);
        $(document).bind('mousedown', onMouseDown);
    },
    
    hide: function() {
        this.cache.box.hide();
        this.cache.background.fadeOut(170);
        this.isVisible = false;
    },
    
    copyToClipboard: function() {
        var text = stylebot.modal.cache.textarea.attr('value');
        stylebot.chrome.copyToClipboard(text);
    }
}