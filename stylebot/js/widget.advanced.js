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

    createUI: function(parent) {
        this.cache.container = $('<div>', {
            id: 'stylebot-advanced'
        });

        $('<div>', {
            id: "stylebot-advanced-header",
            html: "CSS for selected element(s):"
        })
        .appendTo(this.cache.container);
        
        $('<div>', {
            id: "stylebot-advanced-editor"
        })
        .appendTo(this.cache.container);
        
        var self = this;
        
        parent.append(this.cache.container);
        
        setTimeout(function() {
            self.initializeEditor();
        }, 0);
    },
    
    initializeEditor: function() {
        var self = this;
        
        self.cache.editor = ace.edit('stylebot-advanced-editor');
        var editor = self.cache.editor;
        var session = editor.getSession();
        
        var cssMode = require("ace/mode/css").Mode;
        session.setMode(new cssMode());
        session.on('change', self.contentChanged);
        session.on('focus', self.onFocus);
        session.on('blur', self.onBlur);
        session.setUseWrapMode(true);

        editor.renderer.setShowGutter(false);
        editor.setTheme("ace/theme/dawn");
        
        setTimeout(function() {
            self.resize(300);
        }, 0);
    },

    contentChanged: function() {
        stylebot.style.applyCSS(stylebot.widget.advanced.cache.editor.getSession().getValue());
    },
    
    onFocus: function() {
        stylebot.style.saveState();
        self.cache.lastState = self.cache.editor.getSession().getValue();
    },
    
    onBlur: function() {
        var $el = $(e.target);
        if (self.cache.lastState == self.cache.editor.getSession().getValue()) {
            stylebot.style.clearLastState();
        }

        self.cache.lastState = null;
        stylebot.style.refreshUndoState();
    },

    fill: function() {
        var css = CSSUtils.crunchCSSForSelector(stylebot.style.rules, stylebot.style.cache.selector, false, true);
        this.cache.editor.getSession().setValue(css);
    },

    show: function() {
        this.fill();
        this.cache.container.show();
        
        var self = this;
        
        if (!self.isDisabled()) {
            setTimeout(function() {
                self.cache.editor.focus();
                self.cache.editor.gotoLine(self.cache.editor.getSession().getLength(), 0);
            }, 0);
        }
    },

    hide: function() {
        this.cache.container.hide();
    },

    reset: function() {
        this.cache.editor.getSession().setValue('');
        this.cache.editor.focus();
    },
    
    enable: function() {
        if (this.cache.editor === null)
            return;
        this.cache.editor.setReadOnly(false);
    },
    
    disable: function() {
        if (this.cache.editor === null)
            return;
        this.cache.editor.setReadOnly(true);
    },
    
    isDisabled: function() {
        return this.cache.editor.getReadOnly();
    },
    
    resize: function(height) {
        $("#stylebot-advanced-editor").css('height', height);
        setTimeout(function() {
            stylebot.widget.advanced.cache.editor.resize();
        }, 0);
    }
}