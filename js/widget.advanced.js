/**
  * stylebot.widget.advanced
  * 
  * Stylebot Advanced Mode
  **/

stylebot.widget.advanced = {
    
    cache: {
        cssField: null
    },
    
    create: function() {
        var ui = $('<div>', {
            id: 'stylebot-advanced'
        });
        $('<div>', {
            html: "Custom CSS:"
        })
        .appendTo(ui);
        
        this.cache.cssField = $('<textarea>', {
            id: 'stylebot-advanced-css',
            class: 'stylebot-textarea stylebot-control stylebot-css-code'
        })
        .keyup(stylebot.widget.advanced.onKeyUp)
        .appendTo(ui);
        
        ui.appendTo(stylebot.widget.ui.cache.box);
    },
    
    fill: function() {
        this.reset();
        this.cache.cssField.html( stylebot.style.crunchCSSForSelector(stylebot.selector.value, false) );
    },
    
    show: function() {
        $('#stylebot-advanced').show();
        this.fill();
    },
    
    onKeyUp: function(e) {
        stylebot.style.applyInlineCSS( null, stylebot.widget.advanced.cache.cssField.attr('value') );
    },
    
    hide: function() {
        $('#stylebot-advanced').hide();
    },
    
    reset: function() {
        this.cache.cssField.html('');
    },

    // called when mode is toggled, editing is disabled or when an element is selected
    updateRuleCache: function() {
        stylebot.style.saveRulesFromCSS( stylebot.widget.advanced.cache.cssField.attr('value') );
    }
}