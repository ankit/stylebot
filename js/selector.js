/**
  * stylebot.selector
  * 
  * Selector generation for selected element
  **/

stylebot.selector = {
    
    value: null,
    
    generate: function(el){
        this.value = this.inspect(el, 0);
    },
    
    // inspect an element and return a CSS selector for it
    inspect: function(el, level){
        var elId = el.attr("id");
        var elClass = el.attr("class");
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
    }
}