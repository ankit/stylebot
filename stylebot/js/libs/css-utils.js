/**
  * CSS Utility Methods
  *
  * Copyright (c) 2010 Ankit Ahuja
  * Dual licensed under GPL and MIT licenses.
 **/


// generate formatted CSS for all the rules
function crunchCSS(rules,  setImportant) {
    var css = "";

    for(var selector in rules)
    {
        css += selector + "{" + "\n";
        for(var property in rules[selector])
            css += "\t" + getCSSDeclaration(property, rules[selector][property], setImportant) + "\n";
            
        css += "}" + "\n\n";
    }
    console.log("Crunched CSS: " + css);
    return css;
}

function getCSSDeclaration(property, value, setImportant) {
    if(setImportant)
        return property + ": " + value + " !important;";
    else
        return property + ": " + value + ";";
}

// inject <style> element into document
function injectCSS(css) {
    var d = document.documentElement;
    var style = document.createElement('style');
    style.type = "text/css";
    style.title = "stylebot-css";
    style.innerText = css;
    d.insertBefore(style, null);
}