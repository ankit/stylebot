/**
  * stylebot.widget.advanced
  *
  * Advanced mode of CSS editing. For manually writing CSS for selected element(s)
  **/

stylebot.widget.advanced = {

    cache: {
        editor: null,
        container: null,
        lastState: null
    },

    createUI: function() {
        this.cache.container = $('<div>', {
            id: 'stylebot-advanced'
        });

        $('<div>', {
            class: "stylebot-advanced-text",
            html: "CSS for selected element(s):"
        })
        .appendTo(this.cache.container);
        
        var self = this;
        
        this.cache.editor = CodeMirror(this.cache.container.get(0), {
            mode: "css",
            lineNumbers: false,
            indentUnit: 4,
            tabMode: "shift",
            
            onKeyEvent: function(i, e) {
                if (e.type === 'keyup') {
                    self.onKeyUp();
                }
                
                else if (e.type === 'keydown')
                {
                    if (e.keyCode === 27) e.target.blur();
                }
            },
            
            onFocus: function(e) {
                stylebot.style.saveState();
                self.cache.lastState = self.cache.editor.getValue();
            },
            
            onBlur: function(e) {
                var $el = $(e.target);
                if (self.cache.lastState == self.cache.editor.getValue()) {
                    stylebot.style.clearLastState();
                }

                self.cache.lastState = null;
                stylebot.style.refreshUndoState();
            }
        });

        return this.cache.container;
    },

    onKeyUp: function() {
        stylebot.style.applyCSS(stylebot.widget.advanced.cache.editor.getValue());
    },

    fill: function() {
        var css = CSSUtils.crunchCSSForSelector(stylebot.style.rules, stylebot.style.cache.selector, false, true);
        this.cache.editor.setValue(css);
    },

    show: function() {
        this.fill();
        this.cache.container.show();
        
        var self = this;
        
        if (!self.isDisabled()) {
            self.cache.editor.focus();
            self.cache.editor.setCursor(self.cache.editor.lineCount(), 0);
        }
    },

    hide: function() {
        this.cache.container.hide();
    },

    reset: function() {
        this.cache.editor.setValue('');
        this.cache.editor.focus();
    },
    
    enable: function() {
        if (!this.cache.editor)
            return false;
        this.cache.editor.setOption('readOnly', false);
    },
    
    disable: function() {
        this.cache.editor.setOption('readOnly', true);
    },
    
    isDisabled: function() {
        return this.cache.editor.getOption('readOnly');
    },
    
    resize: function(height) {
        this.cache.container.find('.CodeMirror').css('height', height);
    }
}