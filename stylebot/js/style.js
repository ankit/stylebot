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
    
    originalURL: null,
    
    timer: null,
    
    parser: null,
    
    cache: {
        // most recently selected elements' selector
        selector: null,
        // most recently selected elements
        elements: null,
        url: document.domain,
        styleEl: null
    },
    
    // initialize rules and url from temporary variables in apply-css.js
    initialize: function() {
        if (stylebotTempUrl)
        {
            this.cache.url = stylebotTempUrl;
            this.originalURL = stylebotTempUrl;
            delete stylebotTempUrl;
        }
        if (stylebotTempRules)
        {
            this.rules = stylebotTempRules;
            delete stylebotTempRules;
        }
    },
    
    // update current selector and selected elements
    fillCache: function(selector) {
        if (selector != this.cache.selector)
        {
            this.cache.selector = selector;
            this.cache.elements = $(selector + ":not(#stylebot, #stylebot *)");
        }
    },
    
    // applies property-value pair to selected elements as inline css, updates cache and saves the rule
    // called by basic mode
    apply: function(property, value) {
        if (!this.cache.selector || this.cache.selector == "")
            return true;

        this.savePropertyToCache(this.cache.selector, property, value);
        this.save();

        setTimeout(function() {
            stylebot.style.applyInlineCSS(stylebot.style.cache.elements, stylebot.style.getInlineCSS( stylebot.style.cache.selector));
        }, 0);
    },
    
    // add/update property-value pair in rules cache
    savePropertyToCache: function(selector, property, value) {
        // check if the selector already exists in the list
        var rule = this.rules[selector];
        if (rule != undefined)
        {
            if (!this.filter(property, value))
            {
                // does a value for property already exist
                if (rule[property] != undefined)
                {
                    delete this.rules[selector][property];
                 
                    // if no properties left, remove rule as well
                    // TODO: Use something more elegant than this hack.
                    var i = null;
                    for (i in this.rules[selector])
                    { break; }
                 
                    if (!i)
                        delete this.rules[selector];
                }
            }
            else
                rule[property] = value;
        }
        else if (this.filter(property, value))
        {
            this.rules[selector] = new Object();
            this.rules[selector][property] = value;
        }
    },
    
    // applies css to selected elements as inline css and calls saveRuleFromCSS
    // called by advanced mode
    applyCSS: function(css) {
        if (!stylebot.style.cache.selector)
            return true;
        
        var noOfElements = stylebot.style.cache.elements.length;
        
        var duration;
        if (noOfElements >= 400)
            duration = 400;
        else if (noOfElements >= 200)
            duration = 300;
        else
            duration = 0;
        
        if (stylebot.style.applyInlineCSSTimer)
        {
            clearTimeout(stylebot.style.applyInlineCSSTimer);
            stylebot.style.applyInlineCSSTimer = null;
        }
        stylebot.style.applyInlineCSSTimer = setTimeout(function() {
            stylebot.style.applyInlineCSS(stylebot.style.cache.elements, css);
        }, duration);
        
        if (stylebot.style.timer) {
            clearTimeout(stylebot.style.timer);
            stylebot.style.timer = null;
        }
        stylebot.style.timer = setTimeout(function() {
            stylebot.style.saveRuleFromCSS(css);
        }, 1000);
    },
    
    // parses CSS into a rule, updates the cache and saves the rule
    saveRuleFromCSS: function(css) {
        if (!this.cache.selector)
            return true;
        // empty rule for selector
        delete this.rules[this.cache.selector];

        if (!this.parser)
            this.parser = new CSSParser();
        var sheet = this.parser.parse(this.cache.selector + "{" + css + "}");
        var generatedRule = CSSUtils.getRuleFromParserObject(sheet);
        
        // save rule to cache
        this.rules[this.cache.selector] = generatedRule;
        
        // save rules persistently
        this.save();
    },
    
    // check if a property / value pair is valid for addition to rules cache
    filter: function(property, value) {
        if (value == "")
            return false;
        
        var sizeProperties = [ 'font-size', 'line-height', 'letter-spacing', 'letter-height', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-width', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width' ];
        
        if ($.inArray(property, sizeProperties) != -1)
        {
            if ($.inArray(value, WidgetUI.validSizeUnits) != -1)
                return false;
        }
        return true;
    },
    
    // generate inline CSS for selector
    getInlineCSS: function(selector) {
        var rule = this.rules[selector];
        if (rule != undefined)
        {
            var css = "";
            for (var property in rule)
                css += CSSUtils.getCSSDeclaration(property, rule[property], true);

            return css;
        }
        return "";
    },
    
    // apply inline CSS to element(s)
    applyInlineCSS: function(el, newCustomCSS) {
        if (!el || el.length == 0)
            return false;
        
        el.each(function() {
            var existingCSS = $(this).attr('style');
            var existingCustomCSS = $(this).data("stylebot-css");
            var newCSS;

            // if stylebot css is being applied to the element for the first time
            if (!existingCustomCSS)
            {
                // if there is any existing inline CSS, append stylebot CSS to it
                if (existingCSS != undefined)
                {
                    if (existingCSS.length != 0 && existingCSS[existingCSS.length-1] != ";")
                        newCSS = existingCSS + ";" + newCustomCSS;
                    else
                        newCSS = existingCSS + newCustomCSS;
                }
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
            $(this).data("stylebot-css", newCustomCSS);
        });
        
        // update selection box
        setTimeout(function() {
            stylebot.selectionBox.highlight(stylebot.selectedElement);
        }, 0);
    },

    // clear any custom inline CSS for element(s)
    clearInlineCSS: function(el) {
        if (!el)
            return false;
        el.each(function(){
            var existingCSS = $(this).attr('style');
            var existingCustomCSS = $(this).data("stylebot-css");
            if (existingCustomCSS && existingCSS != undefined)
            {
                var newCSS = existingCSS.replace(existingCustomCSS, '');
                $(this).attr({
                    style: newCSS
                });
                // clear stylebot css data associated with element
                $(this).data("stylebot-css", null);
            }
        });
    },
    
    // clear all custom inline CSS
    resetInlineCSS: function() {
        for (var selector in stylebot.style.rules)
            stylebot.style.clearInlineCSS($(selector));
    },

    // remove rule for selector from stylebot's <style> element and apply it as inline css
    removeFromStyleElement: function(selector) {
        this.applyInlineCSS($(selector + ":not(#stylebot, #stylebot *)"), stylebot.style.getInlineCSS(selector));
        
        var tempRules = {};
        for (var sel in this.rules)
        {
            if (sel != selector)
                tempRules[sel] = this.rules[sel];
        }
        this.updateStyleElement(tempRules);
    },
    
    // update css in stylebot's <style> element
    updateStyleElement: function(rules) {
        if (!this.cache.styleEl)
            this.cache.styleEl = $("style[title=stylebot-css]");
        
        if (this.cache.styleEl.length != 0)
            this.cache.styleEl.html(CSSUtils.crunchCSS(rules, true));
        else
        {
            CSSUtils.injectCSS(CSSUtils.crunchCSS( rules, true ), "stylebot-css");
            this.cache.styleEl = $("style[title=stylebot-css]");
        }
    },
    
    // get the rule for a selector from rules cache
    getRule: function(selector) {
        var rule = this.rules[selector];
        if (rule != undefined)
            return rule;
        else
            return null;
    },
    
    // remove any existing custom CSS for current selector from rules cache and selected elements' inline css
    remove: function() {
        if (this.rules[this.cache.selector] != undefined)
            delete this.rules[this.cache.selector];
        this.clearInlineCSS(this.cache.elements);
        setTimeout(function() {
            stylebot.selectionBox.highlight(stylebot.selectedElement);
        }, 0);
    },
    
    // remove all custom css for page from rules cache, stylebot's <style> element and inline css
    removeAll: function() {
        for (var selector in this.rules)
        {
            delete this.rules[selector];
            this.clearInlineCSS($(selector));
        }
        this.updateStyleElement(null);
        setTimeout(function() {
            stylebot.selectionBox.highlight(stylebot.selectedElement);
        }, 0);
    },
    
    // send request to background.html to save all rules in cache
    save: function() {
        // if no rules are present, send null as value, so that entry for url is removed from storage
        var rules = null;
        var i = false;
        for (var i in stylebot.style.rules)
            break;
        if (i)
            rules = stylebot.style.rules;
        stylebot.chrome.save(stylebot.style.cache.url, rules);
        // if (stylebot.style.originalURL != stylebot.style.cache.url)
        //     stylebot.chrome.save(stylebot.style.originalURL, null);
    },

    // send request to background.html to save rule for selector
    saveRule: function(selector, rule) {
        stylebot.chrome.saveRule(stylebot.style.cache.url, selector, rule);
    },
    
    // called when stylebot is disabled. resets cache and all inline css. Also, updates the <style> element
    reset: function() {
        this.cache.selector = null;
        this.cache.elements = null;
        setTimeout(function() {
            stylebot.style.updateStyleElement(stylebot.style.rules);
            stylebot.style.resetInlineCSS();
        }, 100);
    }
}