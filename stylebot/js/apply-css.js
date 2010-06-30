// temporaries used by stylebot.style.init()
var stylebotTempRules;
var stylebotTempUrl;

// send request to background.html to get stylebot rules for page
chrome.extension.sendRequest({ name: "getRulesForPage", url: window.location.href }, function(response){
    console.log("Stylebot Rules for this page: " + response.rules);
    
    // update temp vars for stylebot.style
    stylebotTempRules = response.rules;
    styleTempUrl = response.url;
    
    if(!response.rules)
        return;
    injectCSS( crunchCSS(response.rules, true) );
});

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
    console.log("Stylebot CSS for this page: " + css);
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