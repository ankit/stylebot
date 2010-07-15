/**
  * Generate CSS Selector for an element
  *
  * Copyright (c) 2010 Ankit Ahuja
  * Dual licensed under GPL and MIT licenses.
 **/

var SelectorGenerator =  {
    
    generate: function(el, granularityLevel) {
            if(!el)
                return null;
            else if( granularityLevel == 'low')
                return this.inspectLow(el);
            else if( granularityLevel == 'high')
                return this.inspectHigh(el, 0);
            else
                return this.inspect(el, 0);
    },
    
    // inspect an element and return a CSS selector for it. this is the default mode
    inspect: function(el, level) {
        var elId = el.attr('id');
        var elClass = $.trim(el.attr("class").replace('stylebot-selected', ''));
        if(elClass.length != 0)
        {
            var classes = elClass.split(" ");
            var len = classes.length;
    		var response = el[0].tagName.toLowerCase();

    		for(var i=0; i<len; i++)
    			response += "." + classes[i];

            return response;
        }
        if(elId.length != 0){
            return "#" + elId;
        }
        // don't go beyond 2 levels up
    	if(level < 2)
            return this.inspect(el.parent(), level + 1) + " " + el[0].tagName.toLowerCase();
    	else
            return el[0].tagName.toLowerCase();
    },

    inspectHigh: function(el, level) {
        var elId = el.attr('id');
        if( elId.length != 0 )
            return "#" + elId;

        var elClass = $.trim(el.attr("class").replace('stylebot-selected', ''));
        var elTag = el[0].tagName.toLowerCase();
        var val;

        if( level < 1 )
        {
            val = this.inspectHigh(el.parent(), level + 1) + " " + elTag;
            if(elClass.length != 0)
                val += "." + elClass;
        }
        else
        {
            val = elTag;
            if(elClass.length != 0)
                val += "." + elClass;
        }
        return val;
    },

    inspectLow: function(el) {
        return el[0].tagName.toLowerCase();
    }
};


