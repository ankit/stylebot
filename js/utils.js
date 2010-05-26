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
            console.log("Comparing " + arr[i][pName] + " to " + pValue + "\n");
            if(arr[i][pName] == pValue)
                return i;
        }
        return null;
    }
}