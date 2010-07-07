// temporaries used by stylebot.style.init()
var stylebotTempRules;
var stylebotTempUrl;

// send request to background.html to get stylebot rules for page
chrome.extension.sendRequest({ name: "getRulesForPage", url: window.location.href }, function(response) {
    console.log("Stylebot Rules for this page: " + response.rules);
    
    // update temp vars for stylebot.style
    stylebotTempRules = response.rules;
    styleTempUrl = response.url;
    
    if( !response.rules )
        return;
    CSSUtils.injectCSS( CSSUtils.crunchCSS( response.rules, true ), "stylebot-css" );
});