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
        var css = stylebot.style.crunchCSSForSelector(stylebot.selector.value, false);
        this.cache.cssField.html( css ).attr('value', css);
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
        stylebot.widget.advanced.updateRuleCache();
    },
    
    reset: function() {
        this.cache.cssField.html('');
    },
    
    updateRuleCache: function() {
        stylebot.style.saveRulesFromCSS( stylebot.widget.advanced.cache.cssField.attr('value') );
    }
}