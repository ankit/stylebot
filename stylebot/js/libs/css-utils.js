/**
  * Utility methods for CSS generation and manipulation
  *
  * Copyright (c) 2010 Ankit Ahuja
  * Dual licensed under GPL and MIT licenses.
 **/

var CSSUtils = {
    /*  e.g. of rules object used as input / output:
    
    rules = {
        'a.someclass': { 
                'color': '#fff',
                'font-size': '12px'
            }
        }
    
    */
    crunchCSS: function(rules, setImportant) {
        var css = "";

        for (var selector in rules)
        {
            css += selector + " { ";
            for (var property in rules[selector]) {
                if (rules[selector][property].indexOf("!important") != -1)
                    css += this.getCSSDeclaration(property, rules[selector][property], false);
                else
                    css += this.getCSSDeclaration(property, rules[selector][property], setImportant);
            }
            css += " } ";
        }
        return css;
    },
    
    crunchFormattedCSS: function(rules, setImportant) {
        var css = "";
        for (var selector in rules)
        {
            css += selector + " {" + "\n";
            for (var property in rules[selector])
                css += "\t" + this.getCSSDeclaration(property, rules[selector][property], setImportant) + "\n";

            css += "}" + "\n\n";
        }
        return css;
    },
    
    // generate formatted CSS for selector
    crunchCSSForSelector: function(rules, selector, setImportant, formatted) {
        var css = "";
        var append = "";
        if (formatted)
            append = "\n"
        for (var property in rules[selector])
            css += CSSUtils.getCSSDeclaration( property, rules[selector][property], setImportant ) + append;
        return css;
    },
    
    getCSSDeclaration: function(property, value, setImportant) {
        if (setImportant)
            return property + ": " + value + " !important;";
        else
            return property + ": " + value + ";";
    },
    
    injectCSS: function(css, id) {
        var style = document.createElement('style');
        style.type = "text/css";
        if (id != undefined)
            style.setAttribute("id", id);
        style.appendChild(document.createTextNode(css));
        document.documentElement.appendChild(style);
    },
    
    // parser object is that returned by JSCSSP
    getRulesFromParserObject: function(sheet) {
        var rules = {};
        var len = sheet.cssRules.length;
        for (var i = 0; i < len; i++) {
            var selector = sheet.cssRules[i].mSelectorText;
            rules[selector] = new Object();
            var len2 = sheet.cssRules[i].declarations.length;
            for(var j = 0; j < len2; j++) {
                var property = sheet.cssRules[i].declarations[j].property;
                var value = sheet.cssRules[i].declarations[j].valueText;
                rules[selector][property] = value;
            }
        }
        return rules;
    },
    
    // parser object is that returned by JSCSSP
    getRuleFromParserObject: function(sheet) {
        var rule = {};
        var len = sheet.cssRules[0].declarations.length;
        for (var i = 0; i < len; i++) {
                var property = sheet.cssRules[0].declarations[i].property;
                var value = sheet.cssRules[0].declarations[i].valueText;
                rule[property] = value;
        }
        return rule;
    },
        
    // deprecated
    parseCSS: function(css) {
        var rules = {};
        css = this.removeComments(css);
        var blocks = css.split('}');
        blocks.pop();
        var len = blocks.length;
        for (var i = 0; i < len; i++)
        {
            var pair = blocks[i].split('{');
            rules[$.trim(pair[0])] = this.parseCSSBlock(pair[1]);
        }
        return rules;
    },
    
    // deprecated. instead using http://www.glazman.org/JSCSSP/
    parseCSSBlock: function(css) {
        var rule = {};
        var declarations = css.split(';');
        declarations.pop();
        var len = declarations.length;
        for (var i = 0; i < len; i++)
        {
            var loc = declarations[i].indexOf(':');
            var property = $.trim(declarations[i].substring(0, loc));
            var value = $.trim(declarations[i].substring(loc+1));

            if (property != "" && value != "")
                rule[property] = value;
        }
        return rule;
    },
    
    // from http://www.senocular.com/pub/javascript/CSS_parse.js
    removeComments: function(css) {
        return css.replace(/\/\*(\r|\n|.)*\*\//g,"");
    }
}