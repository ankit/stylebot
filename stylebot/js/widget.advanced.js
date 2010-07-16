/**
  * stylebot.widget.advanced
  * 
  * Stylebot Advanced Mode
  **/

stylebot.widget.advanced = {
    
    cache: {
        cssField: null,
        container: null
    },
    
    defaults: {
        optionsHeight: 195
    },
    
    createUI: function() {
        this.cache.container = $('<div>', {
            id: 'stylebot-advanced'
        });
        $('<div>', {
            html: "Custom CSS:"
        })
        .appendTo( this.cache.container );
        
        this.cache.cssField = $('<textarea>', {
            id: 'stylebot-advanced-css',
            class: 'stylebot-textarea stylebot-control stylebot-css-code'
        })
        .keyup( this.onKeyUp )
        .appendTo( this.cache.container );
        
        return this.cache.container;
    },
    
    onKeyUp: function(e) {
        stylebot.style.applyCSS( stylebot.widget.advanced.cache.cssField.attr( 'value' ) );
    },
    
    fill: function() {
        var css = CSSUtils.crunchCSSForSelector( stylebot.style.rules, stylebot.style.cache.selector, false );
        this.cache.cssField
        .html( css )
        .attr('value', css );
    },
    
    show: function() {
        this.fill();
        this.updateHeight();
        this.cache.container.show();
        setTimeout( function() {
            stylebot.widget.advanced.cache.cssField.focus();
            // place cursor at end of textarea
            var len = stylebot.widget.advanced.cache.cssField.attr( 'value' ).length;
            stylebot.widget.advanced.cache.cssField.get(0).setSelectionRange( len, len );
        });
    },
    
    hide: function() {
        this.cache.container.hide();
    },
    
    reset: function() {
      this.cache.cssField.html('').attr('value', '');
    },
    
    updateHeight: function() {
        var height = window.innerHeight - this.defaults.optionsHeight;
        this.cache.cssField.css('height', height);
    }
}