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
        monkeyPatch: function(selector, editor) {
            editor.hasScrollbar = {vertical: true, horizontal: true};
            editor.updateScrollbars = function() {
                var prevState = {vertical: this.hasScrollbar.vertical, horizontal: this.hasScrollbar.horizontal};

                var horizontalScrollbar = $(selector + " .ace_scroller");
                this.hasScrollbar.horizontal = horizontalScrollbar.innerHeight() > horizontalScrollbar.get(0).clientHeight;

                var verticalScrollbar = $(selector + " .ace_sb");
                this.hasScrollbar.vertical = verticalScrollbar.innerWidth() > verticalScrollbar.get(0).clientWidth;

                if (prevState.vertical != this.hasScrollbar.vertical) {
                    verticalScrollbar.css('right', this.hasScrollbar.vertical ? '0px' : '10000px');
                    $(selector + " .ace_scroller").css('width', this.hasScrollbar.vertical ? '-=15' : '+=15');
                    // force the editor to resize, this is the only way to update the inner content width safely
                    editor.resize();
                }
            };
            
            var session = editor.getSession();
            session.on('change', function() {
                if (editor.timer) {
                    clearTimeout(editor.timer);
                    editor.timer = null;
                }
                editor.timer = setTimeout(function() {
                    try {
                        // let's update it after the timeout in case we've pasted something
                        editor.updateScrollbars();
                    }
                    catch (e) {
                        //
                    }
                }, 100);
            });
            
            // put a non empty value inside the editor, so even if we set the value to empty, it changes
            session.setValue(Math.random().toString());
            
            return editor;
        }
    }
}