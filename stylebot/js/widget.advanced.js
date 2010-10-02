/**
  * stylebot.widget.advanced
  * 
  * Advanced mode
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
            html: "Edit custom CSS for selected element(s):"
        })
        .appendTo(this.cache.container);
        
        this.cache.cssField = $('<textarea>', {
            id: 'stylebot-advanced-css',
            class: 'stylebot-textarea stylebot-control stylebot-css-code'
        })
        .keyup(this.onKeyUp)
        .keydown(function(e) { if (e.keyCode == 27) this.blur(); })
        .focus(function(e) {
            stylebot.style.saveState();
            $(e.target).data('lastState', e.target.value);
        })
        .blur(function(e) {
            if ($(e.target).data('lastState') == e.target.value) {
                stylebot.style.clearLastState();
            }
            $(e.target).data('lastState', null);
            stylebot.style.refreshUndoState();
        })
        .appendTo(this.cache.container);
        
        return this.cache.container;
    },
    
    onKeyUp: function(e) {
        stylebot.style.applyCSS(stylebot.widget.advanced.cache.cssField.attr('value'));
    },
    
    fill: function() {
        var css = CSSUtils.crunchCSSForSelector(stylebot.style.rules, stylebot.style.cache.selector, false, true);
        this.cache.cssField
        .html(css)
        .attr('value', css);
    },
    
    show: function() {
        this.fill();
        this.cache.container.show();
        setTimeout(function() {
            if (!stylebot.widget.advanced.cache.cssField.get(0).disabled) {
                stylebot.widget.advanced.cache.cssField.focus();
                Utils.moveCursorToEnd(stylebot.widget.advanced.cache.cssField.get(0));
            }
        });
    },
    
    hide: function() {
        this.cache.container.hide();
    },
    
    reset: function() {
        this.cache.cssField.html('').attr('value', '').focus();
    }
}