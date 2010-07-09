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
        optionsHeight: 225
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
        .appendTo(this.cache.container);
        
        return this.cache.container;
    },
    
    onKeyUp: function(e) {
        stylebot.style.applyInlineCSS( stylebot.style.cache.elements, stylebot.widget.advanced.cache.cssField.attr('value') );
    },
    
    fill: function() {
        var css = stylebot.style.crunchCSSForSelector(stylebot.style.cache.selector, false);
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
    },

    // called when mode is toggled, editing is disabled, css is viewed or when an element is selected
    updateRuleCache: function() {
        stylebot.style.saveRulesToCacheFromCSS( stylebot.widget.advanced.cache.cssField.attr('value') );
    }
}