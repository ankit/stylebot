console.log("Document domain: " + document.domain);
// send request to background.html to get stylebot rules for page
chrome.extension.sendRequest({ name: "getRulesForPage", domain: document.domain }, function(response){
    console.log("Stylebot Rules for this page: " + response.rules);
    if(!response.rules)
        return;
    injectCSS(crunchCSS(response.rules));
});

function crunchCSS(rules) {
    var css = "";

    for(var selector in rules)
    {
        css += selector + "{" + "\n";
        for(var property in rules[selector])
            css += "\t" + getCSSDeclaration(property, rules[selector][property], true) + "\n";
            
        css += "}" + "\n";
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