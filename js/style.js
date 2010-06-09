/**
  * stylebot.style
  * 
  * Generation and application of CSS rules
  **/

stylebot.style = {

    /*  cache of custom CSS rules applied to elements on the current page
        e.g.: 
        rules = {
            'a': { 
                    'color': '#fff',
                    'font-size': '12px'
                }
            }
    */
    rules: {},
    
    cache: {
        // most recently selected elements' selector
        selector: null,
        // most recently selected elements
        elements: null
    },
    
    // apply a new style to selected elements
    apply: function(selector, property, value){
        if(!selector)
            return true;
        
        // check if a property for the last selected elements is being edited. If not, update cache
        if(selector != this.cache.selector)
        {
            this.cache.selector = selector;
            this.cache.elements = $(selector);
        }

        this.saveRule(this.cache.selector, property, value);
        this.applyInlineCSS(this.cache.elements, this.getInlineCSS(this.cache.selector));
    },
    
    // add/update rule to CSS rules cache
    saveRule: function(selector, property, value){
        // check if the selector already exists in the list
        var rule = this.rules[selector];
        if(typeof(rule) != 'undefined')
        {
            // check if a value for the property already exists
            var pValue = rule[property];
            
            if(typeof(pValue) != 'undefined' && value == "")
                delete rule[property];
            else
                rule[property] = value;
        }
        else if(value != "")
        {
            this.rules[selector] = new Object();
            this.rules[selector][property] = value;
        }
    },
    
    // generate inline CSS
    getInlineCSS: function(selector){

        var rule = this.rules[selector];
        if(typeof(rule) != 'undefined')
        {
            var css = '';
            for(var property in rule)
                css += this.getCSSDeclaration(property, rule[property], true);

            return css;
        }
    },
    
    // apply inline CSS to selected element(s)
    applyInlineCSS: function(el, newCustomCSS){
        if(el.length == 0) return false;
        el.each(function(){
            var existingCSS = $(this).attr('style');
            var existingCustomCSS = $(this).data('stylebot-css');
            var newCSS;
            
            // if stylebot css is being applied to the element for the first time
            if(!existingCustomCSS)
            {
                // if there is any existing inline CSS, append stylebot CSS to it
                if(typeof(existingCSS) != 'undefined')  
                    newCSS = existingCSS + newCustomCSS;
                else
                    newCSS = newCustomCSS;
                $(this).attr({
                    style: newCSS
                });
            }
            else
            {
                // replace existing stylebot CSS with updated stylebot CSS
                newCSS = existingCSS.replace(existingCustomCSS, newCustomCSS);
                $(this).attr({
                    style: newCSS
                });
            }
            // update stylebot css data associated with element
            $(this).data('stylebot-css', newCustomCSS);
        });
    },
    
    // clear any custom inline CSS for element(s)
    clearInlineCSS: function(el){
        el.each(function(){
            var existingCSS = $(this).attr('style');
            var existingCustomCSS = $(this).data('stylebot-css');
            
            if(existingCustomCSS && typeof(existingCSS) != 'undefined')
            {
                var newCSS = existingCSS.replace(existingCustomCSS, '');
                $(this).attr({
                    style: newCSS
                });
                // clear stylebot css data associated with element
                $(this).data('stylebot-css', null);
            }
        });
    },
    
    // get all the custom CSS rule set for the selector in cache
    getRule: function(selector){
        var rule = this.rules[selector];
        if(typeof(rule) != 'undefined')
            return rule;
        else
            return null;
    },
    
    // generate CSS for all the rules in cache
    crunchCSS: function(){
        var css = '';

        for(var selector in this.rules)
        {
            css += selector + "{" + "\n";
            for(var property in this.rules[selector])
                css += "\t" + this.getCSSDeclaration(property, this.rules[selector][property]) + "\n";
                
            css += "}" + "\n";
        }
        return css;
    },
    
    getCSSDeclaration: function(property, value, setImportant){
        if(setImportant)
            return property + ": " + value + " !important;";
        else
            return property + ": " + value + ";";
    },
    
    // clear any existing custom CSS for current selector in cache
    clear: function(){
        var rule = this.rules[this.cache.selector];
        if(typeof(rule) != 'undefined')
            delete rule;

        this.clearInlineCSS(this.cache.elements);
    }
}