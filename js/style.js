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
    
    fillCache: function(selector) {
        if(selector != this.cache.selector)
        {
            this.cache.selector = selector;
            this.cache.elements = $(selector);
        }
    },
    
    // apply a new style to selected elements
    apply: function(property, value) {
        if(!this.cache.selector)
            return true;
        
        this.saveRule(this.cache.selector, property, value);
        this.applyInlineCSS(this.cache.elements, this.getInlineCSS(this.cache.selector));
    },
    
    // add/update rule to CSS rules cache
    saveRule: function(selector, property, value) {
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
    getInlineCSS: function(selector) {

        var rule = this.rules[selector];
        if(rule != undefined)
        {
            var css = '';
            for(var property in rule)
                css += this.getCSSDeclaration(property, rule[property], true);

            return css;
        }
    },
    
    // apply inline CSS to selected element(s)
    applyInlineCSS: function(el, newCustomCSS) {
        if(el.length == 0) return false;
        el.each( function() {
            var existingCSS = $(this).attr('style');
            var existingCustomCSS = $(this).data('stylebot-css');
            var newCSS;
            
            // if stylebot css is being applied to the element for the first time
            if(!existingCustomCSS)
            {
                // if there is any existing inline CSS, append stylebot CSS to it
                if(existingCSS != undefined)
                    // TODO: Only add ; if there is no trailing ; in existingCSS
                    newCSS = existingCSS + ";" + newCustomCSS;
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
    clearInlineCSS: function(el) {
        el.each(function(){
            var existingCSS = $(this).attr('style');
            var existingCustomCSS = $(this).data('stylebot-css');
            
            if(existingCustomCSS && existingCSS != undefined)
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
    getRule: function(selector) {
        var rule = this.rules[selector];
        if(rule != undefined)
            return rule;
        else
            return null;
    },
    
    // generate CSS for all the rules in cache
    crunchCSS: function(setImportant) {
        var css = "";

        for(var selector in this.rules)
        {
            css += selector + "{" + "\n";
            for(var property in this.rules[selector])
                css += "\t" + this.getCSSDeclaration(property, this.rules[selector][property], setImportant) + "\n";
                
            css += "}" + "\n\n";
        }
        return css;
    },
    
    getCSSDeclaration: function(property, value, setImportant) {
        if(setImportant)
            return property + ": " + value + " !important;";
        else
            return property + ": " + value + ";";
    },
    
    // clear any existing custom CSS for current selector
    clear: function() {
        if(this.rules[this.cache.selector] != undefined)
            delete this.rules[this.cache.selector];
        this.clearInlineCSS(this.cache.elements);
    },
    
    // save rules for page
    save: function() {
        stylebot.chrome.save(document.domain, stylebot.style.rules);
    },
    
    // load rules for page 
    load: function(callback) {
        stylebot.chrome.load(document.domain, function(rules){
            if(rules)
                stylebot.style.rules = rules;
            if(callback != undefined)
                callback();
        });
    },
    
    // This applies all rules for page as inline CSS to elements and clears the stylebot <style> element. This is done
    // because when an element's styles are edited, they are applied as inline CSS.
    
    // An alternate approach can be to crunchCSS for page everytime a style is edited and update <style>'s html,
    // which maybe more costly

    // this method is called when page's DOM finishes loading.
    // maybe call this when stylebot is enabled for the first time instead?
    initInlineCSS: function() {
        for(var selector in stylebot.style.rules)
        {
            stylebot.style.applyInlineCSS($(selector), stylebot.style.getInlineCSS(selector));
        }
        $('style[title=stylebot-css]').html('');
    },
    
    // inject <style> element into page
    injectCSS: function() {
        var d = document.documentElement;
        var css = stylebot.style.crunchCSS(true);
        var style = document.createElement('style');
        style.type = "text/css";
        style.innerText = css;
        d.insertBefore(style, null);
    }
}