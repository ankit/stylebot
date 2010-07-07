/**
  * Utility methods for CSS generation and manipulation
  *
  * Copyright (c) 2010 Ankit Ahuja
  * Dual licensed under GPL and MIT licenses.
 **/


var CSSUtils = {
    
    /*  e.g. of rules object used as input in several methods:
    
    rules = {
        'a.someclass': { 
                'color': '#fff',
                'font-size': '12px'
            }
        }
    
    */

    // generate formatted CSS for rules
    crunchCSS: function(rules, setImportant) {
        var css = "";

        for(var selector in rules)
        {
            css += selector + "{" + "\n";
            for(var property in rules[selector])
                css += "\t" + this.getCSSDeclaration(property, rules[selector][property], setImportant) + "\n";

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
    
    injectCSS: function(css, title) {
        var d = document.documentElement;
        var style = document.createElement('style');
        style.type = "text/css";
        style.title = title;
        style.innerText = css;
        d.insertBefore(style, null);
    },
    
    generateRuleFromCSS: function(css) {
        var rule = {};
        var declaration = css.split(';');
        var len = declaration.length;
        
        for(var i=0; i<len; i++)
        {
            var pair = declaration[i].split(':');
            var property = $.trim( pair[0] );
            var value = $.trim( pair[1] );
            rule[ property ] = value;
        }
        
        return rule;
    }
}

