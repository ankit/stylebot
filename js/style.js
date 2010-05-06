/* Code to add/remove custom styles */

Stylebot.Style = {
    //Temporary cache to store style when it is being tested
    tempCache:null,
    list:[],
    isStyleBeingEdited:false,
    apply: function(selector, property, value){
        var el = $(selector);
        if(!this.isStyleBeingEdited)
            tempCache = {el:el, property: property, value: value, originalValue: el.css(property)};
        this.isStyleBeingEdited = true;
        el.css(property, value);
    },
    remove: function(selector, property){
        
    },
    resetTemporaryCache: function(){
        if(tempCache)
        {
            console.log(tempCache.originalValue);
            tempCache.el.css(tempCache.property, tempCache.originalValue);
            tempCache = null;
        }
        this.isStyleBeingEdited = false;
    },
    addToList: function(){
        //write code here to add style in temporary cache to the current page's style rules list
        this.isStyleBeingEdited = false;
    }
}