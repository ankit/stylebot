/**
  * General JavaScript utility methods used in stylebot
  *
  * Copyright (c) 2010 Ankit Ahuja
  * Dual licensed under GPL and MIT licenses.
  **/

var Utils = {

    // return array index at which property pName is equal to value 'pValue'
    search: function(arr, pName, pValue) {
        var len = arr.length;
        for (var i = 0; i < len; i++)
        {
            if (arr[i][pName] == pValue)
                return i;
        }

        return null;
    },

    // if any of the passed keys is pressed, returns false.
    // Accepts a keys array and 'keyup' event object as arguments.
    // TODO: Add support for keydown, keypress events and alphanumeric keys
    filterKeys: function(keys, e) {
        if (typeof(e.keyCode) == 'undefined')
            return true;
        var len = keys.length;
        var keyCodes = {
            'ctrl': 17,
            'shift': 16,
            'tab': 9,
            'esc': 27,
            'enter': 13,
            'caps': 20,
            'option': 18,
            'backspace': 8,
            'left': 37,
            'top': 38,
            'right': 39,
            'bottom': 40,
            'arrowkeys':[ 37, 38, 39, 40 ],
        }
        for (var i = 0; i < len; i++){
            var code = keyCodes[keys[i]];
            if (code.length > 1) // it is an array
            {
                if ($.inArray(e.keyCode, code) != -1)
                    return false;
            }
            else
            {
                if (e.keyCode == code)
                    return false;
            }
        }
        return true;
    },

    capitalize: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    
    /**
     *  Make text editable in place. Replaces text with textarea for editing.
     *  Requires Utils.editElement and Utils.endEditing
     *  @param {Element} el Element which contains the text
     *  @param {Function} callback Function to be called when user finishes editing
     *  @param {Object} options Options for edit in place field
     *  @return {true}
     */
    makeEditable: function($el, callback, options) {
        var editFieldClass = 'editing-field';
        
        if (options && options.editFieldClass) {
            editFieldClass = options.editFieldClass;
        }
        
        $el.addClass('editable');
        
        $el.bind('click keydown', {callback: callback}, function(e)
        {
            if (e.type === 'keydown' && e.keyCode != 13)
                return true;
            
            Utils.editElement($el, options);

            var onClose = function(e) {
                if (e.type === "keydown" && e.keyCode != 13 && e.keyCode != 27)
                    return true;
                
                if (e.type === "mousedown" && e.target.className === editFieldClass)
                    return true;
                
                e.preventDefault();
                
                Utils.endEditing($el);
                
                e.data.callback($el.text());
                
                $(document).unbind("mousedown", onClose);
                $(document).unbind("keydown", onClose);
            }
            
            $(document).bind('keydown mousedown', { callback: callback }, onClose);
        });
        
        return true;
    },
    
    editElement: function($el, someOptions) {
        // default options
        var options = {
            editFieldClass  : 'editing-field',
            selectText      : true,
            fixedWidth      : false
        };
        
        if (someOptions) {
            for (var option in someOptions)
                options[option] = someOptions[option];
        }
        
        $el.hide();
        
        var elWidth;
        
        if (options && options.fixedWidth)
            elWidth = options.fixedWidth;
        else
            elWidth = $el.width();

        var fontSize = $el.css('font-size');
        var fontFamily = $el.css('font-family');
        var fontWeight = $el.css('font-weight');
        var lineHeight = $el.css('line-height');

        var padding = {
            top: parseInt($el.css('padding-top').replace('px', '')),
            right: parseInt($el.css('padding-right').replace('px', '')),
            bottom: parseInt($el.css('padding-bottom').replace('px', '')),
            left: parseInt($el.css('padding-left').replace('px', ''))
        };

        var value = $el.text();
        
        // get the required height of textarea by creating a temporary div
        //
        var tempDiv = $('<div>', {
            html: value
        })
        .css({
            'line-height'       : lineHeight,
            'word-wrap'         : 'break-word'
        })
        .width(elWidth);
        
        $el.before(tempDiv);
        
        var height = tempDiv.height() + padding.top + padding.bottom;
        
        tempDiv.remove();
        
        var textarea = $('<textarea>', {
            value: value,
            class: options.editFieldClass
        })
        .width(elWidth)
        .height(height)
        .css({
            'font-family'       : fontFamily,
            'font-size'         : fontSize,
            'font-weight'       : fontWeight,
            'line-height'       : lineHeight,
            'overflow-y'        : 'hidden',
            'resize'            : 'none'
        });
        
        if (options.selectText) {
            textarea.bind('click keyup', function(e)
            {
                if (e.type === 'keyup' && e.keyCode != 9) return true;
                
                e.preventDefault();
                e.target.focus();
                e.target.select();
            });
        }
        
        $el.before(textarea);
        textarea.focus();

        // if selectText is set to true, select all text in input field
        // else set cursor to the end of field
        //
        var len = value.length;
        
        if (value[len - 1] === "\n")
            len = len - 1;
        
        if (options && options.selectText)
            textarea.get(0).setSelectionRange(0, len);
        
        $el.data('value', value);
    },
    
    endEditing: function($el) {
        if ($el === undefined)
            return;
        
        var value = $.trim($el.prev('textarea').attr('value'));
        
        $el.prev('textarea').remove();
        
        if (value === '')
            value = $el.data('value');
        
        $el.data('value', null);
        
        $el.html(value);
        $el.show();
        $el.focus();
    },

    selectText: function(el, start, end) {
        if (!el || !el.value || el.value === "")
            return false;
        var len = el.value.length;
        if (end > len) end = len;
        el.setSelectionRange(start, end);
        return true;
    },

    selectAllText: function(el) {
        if (!el || !el.value || el.value === "")
            return false;
        var len = el.value.length;
        el.setSelectionRange(0, len);
        return true;
    },

    moveCursorToEnd: function(el) {
        if (!el || !el.value || el.value === "")
            return false;
        var len = el.value.length;
        el.setSelectionRange(len, len);
        if (el.localName == "textarea") {
            el.scrollTop = el.scrollHeight;
        }
    },

    HTMLDecode: function(text) {
        if (text && typeof(text) != "undefined")
        {
            // replace &lt; with < and &gt; with >
            return text.replace("&lt;", "<").replace("&gt;", ">");
        }
    },

    // To copy an object. from: http://my.opera.com/GreyWyvern/blog/show.dml/1725165
    cloneObject: function(obj) {
        var newObj = (obj instanceof Array) ? [] : {};

        for (i in obj)
        {
            if (obj[i] && typeof obj[i] == "object")
            {
                newObj[i] = this.cloneObject(obj[i]);
            }
            else
                newObj[i] = obj[i]
        }

        return newObj;
    },
    
    // functions for ace
    ace: {
        monkeyPatch: function(editor) {
            // monkey-patch the editor to add the disable function, sets it to readOnly, hides the cursor and line marker
            editor.disabledProp = false;
            editor.setDisabled = function(readOnly) {
                this.renderer.$cursorLayer.element.style.display = readOnly ? 'none' : '';
                this.renderer.$markerBack.element.style.display = readOnly ? 'none' : '';
                this.renderer.$markerFront.element.style.display = readOnly ? 'none' : '';
                this.setReadOnly(readOnly);
                this.disabledProp = readOnly;
            }
            
            editor.getDisabled = function() {
                return this.disabledProp;
            }
                              
            // monkey-patch the editor the correctly display the vertical scrollbar
            editor.previousScrollbarWidth = 0;
            var scrollbarWidth = editor.renderer.scrollBar.getWidth();
            editor.renderer.scrollBar.getWidth = function() {
                return this.width > this.element.clientWidth ? scrollbarWidth : 0;
            };
            
            /* as for now, due to ace's limitations this is the only safe way to
               update the markers and the wrap limit. At least, let's make sure we
               update the editor's width only, and only if it's necessary
             */
            editor.getSession().on('change', function() {
                setTimeout( function() {
                    if (editor.renderer.scrollBar.getWidth() != editor.previousScrollbarWidth) {
                        editor.previousScrollbarWidth = editor.renderer.scrollBar.getWidth();
                        if (editor.previousScrollbarWidth == scrollbarWidth) {
                            editor.renderer.scroller.style.width = Math.max(0, editor.renderer.scroller.clientWidth - scrollbarWidth) + "px";
                        } else {
                            editor.renderer.scroller.style.width = Math.max(0, editor.renderer.scroller.clientWidth + scrollbarWidth) + "px";
                        }
                        if (editor.renderer.session.getUseWrapMode()) {
                            var availableWidth = editor.renderer.scroller.clientWidth - editor.renderer.$padding * 2;
                            editor.renderer.session.adjustWrapLimit(Math.floor(availableWidth / editor.renderer.characterWidth) - 1);
                        }
                        editor.renderer.$size.scrollerWidth = editor.renderer.scroller.clientWidth;
                        editor.renderer.$loop.schedule(editor.renderer.CHANGE_FULL);
                    }
                }, 100);
            });
            
            return editor;
        }
    }
}