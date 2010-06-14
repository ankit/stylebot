/**
  * stylebot.utils
  * 
  * Stylebot Utility methods
  **/

stylebot.utils = {
    
    // return array index at which property pName is equal to value 'pValue'
    search: function(arr, pName, pValue) {
        var len = arr.length;
        for(var i=0; i<len; i++)
        {
            if(arr[i][pName] == pValue)
                return i;
        }
        return null;
    },
    
    // if any of the passed keys is pressed, returns false.
    // Accepts a keys array and 'keyup' event object as arguments.
    // TODO: Add support for keydown, keypress events and alphanumeric keys
    filterKeys: function(keys, e) {
        if(typeof(e.keyCode) == 'undefined')
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
        for(var i=0; i<len; i++){
            var code = keyCodes[keys[i]];
            if(code.length > 1) // it is an array
            {
                if($.inArray(e.keyCode, code) != -1)
                    return false;
            }
            else
            {
                if(e.keyCode == code)
                    return false;
            }
        }
        return true;
    },
    
    capitalize: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    
    makeEditable: function(el, callback) {
        el.bind('click', { callback: callback }, function(e) {
            // hide element
            $(this).hide();
            
            var value = $(this).html();
            // create a textfield
            var input = $('<input>', {
                type: 'text',
                class: 'stylebot-textfield',
                length: 10,
                value: value,
                id: 'stylebot-editing-field'
            });
            
            $(this).parent().append(input);
            input.focus();
            
            var onMouseDown = function(e) {
                if(input.length == 0)
                    return true;
                
                if(e.target.id != e.data.input.attr('id'))
                {
                    var value = e.data.input.attr('value');
                    e.data.input.remove();
                    if(value != ""){
                        e.data.el.html(value);
                        e.data.callback(value);
                    }
                    e.data.el.show();
                    $(document).bind('mouseup', onMouseUp);
                }
            };
            
            var onMouseUp = function(e) {
                $(document).unbind('mouseup', onMouseUp);
                $(document).unbind('mousedown', onMouseDown);
            }
            
            
            var onKeyDown = function(e) {
                var value = e.data.input.attr('value');
                if(e.keyCode == 13 || e.keyCode == 27) // on enter or esc
                {
                    e.data.input.remove();
                    if(value != ""){
                        e.data.el.html(value);
                        e.data.callback(value);
                    }
                    e.data.el.show();
                    $(document).unbind('mousedown', onMouseDown);
                }
            };
            
            input.bind('keyup', {input: input, el: $(this), callback: callback}, onKeyDown);
            $(document).bind('mousedown', {input: input, el: $(this), callback: callback}, onMouseDown);
            
        });
    }
}