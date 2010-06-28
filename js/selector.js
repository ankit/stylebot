/**
  * stylebot.selector
  * 
  * Selector generation for selected element
  **/

stylebot.selector = {
    
    value: null,
    
    mode: 'medium', // level of specificity: low (tag), medium (class), high (id)
    
    generate: function(el){
        if(!el)
            this.value = null;
        else if(this.mode == 'low')
            this.value = this.inspectLow(el);
        else if(this.mode == 'high')
            this.value = this.inspectHigh(el, 0);
        else
            this.value = this.inspect(el, 0);
    },
    
    // inspect an element and return a CSS selector for it.
    inspect: function(el, level){
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
}