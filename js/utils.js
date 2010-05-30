/**
  * stylebot.utils
  * 
  * Stylebot Utility methods
  **/

stylebot.utils = {
    
    // return array index at which property pName is equal to value 'pValue'
    search: function(arr, pName, pValue){
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
    filterKeys: function(keys, e){
        console.log("KeyCode: " + e.keyCode);
        var len = keys.length;
        var keyCodes = {
            'ctrl':17,
            'shift':16,
            'tab':9,
            'esc':27,
            'enter':13,
            'caps':20,
            'option':18,
            'backspace':8,
            'left':37,
            'top':38,
            'right':39,
            'bottom':40,
            'arrowkeys':[37, 38, 39, 40],
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
    }
}