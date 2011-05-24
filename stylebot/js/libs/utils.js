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

    makeEditable: function(el, callback, options) {
        el.bind('click keyup', {callback: callback}, function(e) {
            if (e.type == 'keyup' && e.keyCode != 13)
                return true;

            var el = $(this);
            el.hide();

            var elWidth;
            if (options && options.fixedWidth)
                elWidth = options.fixedWidth;
            else
                elWidth = el.width();

            var value = el.text();
            // create a textfield
            var input = $('<input>', {
                type: 'text',
                class: 'stylebot-textfield',
                value: value,
                id: 'stylebot-editing-field'
            })
            .width(elWidth);

            el.before(input);
            input.focus();

            // if selectText is set to true, select all text in input field
            if (options && options.selectText)
                input.get(0).setSelectionRange(0, value.length);

            var onClose = function(e) {
                if (e.type == "keyup") {
                    switch (e.keyCode) {
                        case 38: // up
                            var nextUrl = e.data.el.parent().prev().children(".custom-style-url");
                            // if the target element doesn't exist, ignore this event
                            if (nextUrl.length == 0) return true;
                            break;
                        case 40: // down
                            var nextUrl = e.data.el.parent().next().children(".custom-style-url");
                            // if the target element doesn't exist, ignore this event
                            if (nextUrl.length == 0) return true;
                            break;
                        case 13: // enter
                        case 27: // escape
                        break;
                        // if it is not an allowed key, ignore this event
                        default:
                            return true;
                    }
                }
                
                // if it's a mousedown event and the target is the element itself, ignore it
                if (e.type == "mousedown" && e.target.id == e.data.input.attr('id'))
                    return true;
                
                var value = e.data.input.attr('value');
                value = value == "" ? e.data.el.html() : value;
                
                // remove the input
                e.data.input.remove();
                
                // display the url's div
                e.data.el.html(value);
                e.data.el.show();
                e.data.callback(value);
                
                // if available, let's focus the next element
                if (nextUrl) nextUrl.click();
                
                $(document).unbind("mousedown", onClose);
                $(document).unbind("keyup", onClose);
            }

            input.bind('keyup', {input: input, el: el, callback: callback}, onClose);
            $(document).bind('mousedown',{input: input, el: el, callback: callback}, onClose);
        });
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
                    editor.$updateHighlightActiveLine();
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