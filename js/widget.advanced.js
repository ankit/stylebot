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
    
    create: function() {
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
        .keyup(stylebot.widget.advanced.onKeyUp)
        .appendTo(this.cache.container);
        
        this.cache.container.appendTo(stylebot.widget.ui.cache.box);
    },
    
    onKeyUp: function(e) {
        stylebot.style.applyInlineCSS( null, stylebot.widget.advanced.cache.cssField.attr('value') );
    },
    
    fill: function() {
        var css = stylebot.style.crunchCSSForSelector(stylebot.selector.value, false);
        this.cache.cssField
        .html( css )
        .attr('value', css );
    },
    
    show: function() {
        this.fill();
        this.setHeight();
        this.cache.container.show();
    },
    
    hide: function() {
        this.cache.container.hide();
    },
    
    setHeight: function() {
        stylebot.widget.setHeight();
        var height = window.innerHeight - 275;
        // if( height < 0 )
        //     height = 10;
        this.cache.cssField.css('height', height);
    },

    // called when mode is toggled, editing is disabled or when an element is selected
    updateRuleCache: function() {
        stylebot.style.saveRulesFromCSS( stylebot.widget.advanced.cache.cssField.attr('value') );
    }
}