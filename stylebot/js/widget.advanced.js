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
    
    createUI: function() {
        this.cache.container = $('<div>', {
            id: 'stylebot-advanced'
        });
        $('<div>', {
            html: "Custom CSS:"
        })
        .appendTo(this.cache.container);
        
        this.cache.cssField = $('<textarea>', {
            id: 'stylebot-advanced-css',
            class: 'stylebot-textarea stylebot-control stylebot-css-code'
        })
        .keyup(this.onKeyUp)
        .keydown(function(e) { if (e.keyCode == 27) this.blur(); })
        .appendTo(this.cache.container);
        
        return this.cache.container;
    },
    
    onKeyUp: function(e) {
        stylebot.style.applyCSS(stylebot.widget.advanced.cache.cssField.attr('value'));
    },
    
    fill: function() {
        var css = CSSUtils.crunchCSSForSelector(stylebot.style.rules, stylebot.style.cache.selector, false);
        this.cache.cssField
        .html(css)
        .attr('value', css);
    },
    
    show: function() {
        this.fill();
        this.cache.container.show();
        setTimeout(function() {
            stylebot.widget.advanced.cache.cssField.focus();
            // place cursor at end of textarea
            var len = stylebot.widget.advanced.cache.cssField.attr('value').length;
            stylebot.widget.advanced.cache.cssField.get(0).setSelectionRange(len, len);
        });
    },
    
    hide: function() {
        this.cache.container.hide();
    },
    
    reset: function() {
        this.cache.cssField.html('').attr('value', '').focus();
    }
}