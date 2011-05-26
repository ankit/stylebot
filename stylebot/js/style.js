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

    timer: null,

    parser: null,

    status: true,

    // the undo stack. size is limited to last 5 actions
    undoStack: [],

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
            delete stylebotTempUrl;
        }

        // if domain is empty, return url
        else if (!this.cache.url || this.cache.url == "") {
            this.cache.url = location.href;
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
            try {
                this.cache.elements = $(selector + ":not(#stylebot, #stylebot *)");
            }

            catch(e) {
                this.cache.elements = null;
            }
        }
    },

    // applies property-value pair to currently selected elements as inline css, updates cache and saves the rule
    // called by basic mode
    apply: function(property, value) {
        if (!this.cache.selector || this.cache.selector == "")
            return true;
        this.savePropertyToCache(this.cache.selector, property, value);
        this.save();
        setTimeout(function() {
            if (stylebot.style.cache.elements && stylebot.style.cache.elements.length != 0) {
                stylebot.style.updateInlineCSS(stylebot.style.cache.elements, stylebot.style.getInlineCSS( stylebot.style.cache.selector));
            }
            // if no elements, update the stylesheet
            else {
                stylebot.style.updateStyleElement(stylebot.style.rules);
            }
        }, 0);
    },

    // applies css to selected elements as inline css and calls saveRuleFromCSS
    // called by advanced mode
    applyCSS: function(css) {
        if (!stylebot.style.cache.selector)
            return true;

        // calculating timer duration based upon number of elements
        var duration;

        if (stylebot.style.cache.elements)
        {
            var noOfElements = stylebot.style.cache.elements.length;

            if (noOfElements >= 400)
                duration = 400;
            else if (noOfElements >= 200)
                duration = 300;
            else
                duration = 0;
        }

        else {
            duration = 0;
        }

        if (stylebot.style.updateCSSTimer)
        {
            clearTimeout(stylebot.style.updateCSSTimer);
            stylebot.style.updateCSSTimer = null;
        }

        stylebot.style.updateCSSTimer = setTimeout(function() {

            stylebot.style.saveRuleFromCSS(css, stylebot.style.cache.selector);

            if (stylebot.style.cache.elements && stylebot.style.cache.elements.length != 0)
            {
                var newCSS = CSSUtils.crunchCSSForSelector(stylebot.style.rules, stylebot.style.cache.selector, true);
                stylebot.style.updateInlineCSS(stylebot.style.cache.elements, newCSS);
            }

            else
                stylebot.style.updateStyleElement(stylebot.style.rules);

        }, duration);

        if (stylebot.style.timer) {
            clearTimeout(stylebot.style.timer);
            stylebot.style.timer = null;
        }

        stylebot.style.timer = setTimeout(function() {
            stylebot.style.save();
        }, 1000);
    },

    // called when CSS of the entire page is edited in the stylebot panel
    applyPageCSS: function(css, save) {
        if (save === undefined)
            save = true;
        
        var parsedRules = {};
        
        if (css != "")
        {
            if (!this.parser)
                this.parser = new CSSParser();

            try {
                var sheet = this.parser.parse(css, false, true);
                parsedRules = CSSUtils.getRulesFromParserObject(sheet);
            }

            catch(e) {
                //
            }
        }
        
        if (parsedRules['error']) {
            return parsedRules['error'];
        }
        
        this.clearInlineCSS(this.cache.elements);
        this.updateStyleElement(parsedRules);
        
        if (save) {
            this.rules = parsedRules;
            this.save();
        }
        
        return true;
    },

    // parses CSS into a rule, updates the cache and saves the rule
    saveRuleFromCSS: function(css, selector) {
        if (!selector)
            return true;

        // empty rule for selector
        delete this.rules[selector];

        if (css != "") {

            if (!this.parser)
                this.parser = new CSSParser();

            var sheet = this.parser.parse(selector + "{" + css + "}", false, true);
            var generatedRule = CSSUtils.getRuleFromParserObject(sheet);

            // save rule to cache
            this.rules[selector] = generatedRule;
        }
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

    // check if a property / value pair is valid for addition to rules cache
    filter: function(property, value) {
        if (value == "")
            return false;

        var sizeProperties = [ 'font-size', 'line-height', 'letter-spacing', 'letter-height', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-width', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width' ];

        if ($.inArray(property, sizeProperties) != -1 && parseFloat(value))
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
            for (var property in rule) {
                if(property.indexOf("comment") != -1) continue;
                css += CSSUtils.getCSSDeclaration(property, rule[property], true);
            }

            return css;
        }

        return "";
    },

    // apply inline CSS to element(s)
    updateInlineCSS: function(el, newCustomCSS) {
        if (!el || el.length == 0)
            return false;

        el.each(function() {
            var $this = $(this);

            var existingCSS = $this.attr('style');
            existingCSS = existingCSS ? $.trim(existingCSS) : "";

            var existingCustomCSS = $this.data("stylebotCSS");
            existingCustomCSS = existingCustomCSS ? $.trim(existingCustomCSS) : "";

            var newCSS;

            // if stylebot css is being applied to the element for the first time
            if (!existingCustomCSS)
            {
                // if there is any existing inline CSS, append stylebot CSS to it
                if (existingCSS != undefined)
                {
                    if (existingCSS.length != 0 && existingCSS[existingCSS.length - 1] != ";")
                        newCSS = existingCSS + ";" + newCustomCSS;
                    else
                        newCSS = existingCSS + newCustomCSS;
                }

                else
                    newCSS = newCustomCSS;
            }

            else
            {
                // replace existing stylebot CSS with updated stylebot CSS
                newCSS = existingCSS.replace(existingCustomCSS, newCustomCSS);
            }

            // update style
            $this.attr('style', newCSS);

            // update stylebot css data associated with element
            $this.data("stylebotCSS", newCustomCSS);
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

        el.each(function() {
            var $this = $(this);

            var existingCSS = $this.attr('style');
            var existingCustomCSS = $this.data("stylebotCSS");

            if (existingCustomCSS != undefined && existingCSS != undefined)
            {
                var newCSS = existingCSS.replace(existingCustomCSS, '');
                $this.attr('style', newCSS);

                // clear stylebot css data associated with element
                $this.data("stylebotCSS", null);
            }
        });
    },

    // clear all custom inline CSS
    resetInlineCSS: function() {
        for (var selector in stylebot.style.rules)
            stylebot.style.clearInlineCSS($(selector));
    },

    // remove rule for current selector from stylebot's <style> element and apply it as inline css
    removeFromStyleElement: function() {
        // if no elements are selected, return
        if (!this.cache.elements || this.cache.elements.length == 0)
            return;
        this.updateInlineCSS(this.cache.elements, this.getInlineCSS(this.cache.selector));

        var tempRules = {};

        for (var sel in this.rules)
        {
            if (sel != this.cache.selector)
                tempRules[sel] = this.rules[sel];
        }

        this.updateStyleElement(tempRules);
    },

    // update css in stylebot's <style> element
    //
    updateStyleElement: function(rules) {
        if (!this.cache.styleEl)
            this.cache.styleEl = $("#stylebot-css");

        if (this.cache.styleEl.length != 0) {
            this.cache.styleEl.html(CSSUtils.crunchCSS(rules, true));
        }
        else
        {
            CSSUtils.injectCSS(CSSUtils.crunchCSS( rules, true ), "stylebot-css");
            this.cache.styleEl = $("#stylebot-css");
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
        if (this.rules[this.cache.selector])
            delete this.rules[this.cache.selector];

        this.clearInlineCSS(this.cache.elements);

        setTimeout(function() {
            stylebot.selectionBox.highlight(stylebot.selectedElement);
        }, 0);

        // save
        this.save();
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

        // save
        this.save();
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
    },

    // called when stylebot is disabled. resets cache and all inline css. Also, updates the <style> element
    reset: function() {
        var duration = 100;
        stylebot.style.cache.selector = null;
        stylebot.style.cache.elements = null;
        setTimeout(function() {
            stylebot.style.updateStyleElement(stylebot.style.rules);
            stylebot.style.resetInlineCSS();
        }, duration);
    },

    undo: function() {
        if (this.undoStack.length == 0)
            return false;
        this.rules = this.undoStack.pop();
        this.clearInlineCSS(this.cache.elements);
        this.updateStyleElement(this.rules);
        this.save();
        stylebot.widget.open();
        setTimeout(function() {
            stylebot.highlight(stylebot.selectedElement);
        }, 0);
        this.refreshUndoState();
    },

    // save current state to undo stack
    saveState: function() {
        if (this.undoStack.length >= 5) {
            this.undoStack.shift();
        }
        this.undoStack.push(Utils.cloneObject(this.rules));
    },

    clearLastState: function() {
        this.undoStack.pop();
    },

    shouldEnableUndo: function() {
        if (this.undoStack.length == 0)
            return false;
        else
            return true;
    },

    refreshUndoState: function() {
        if (!this.shouldEnableUndo())
            stylebot.widget.disableUndo();
        else
            stylebot.widget.enableUndo();
    },

    disable: function() {
        this.status = false;
        $("#stylebot-css").html('');
    },

    enable: function() {
        if (this.status)
            return;
        this.status = true;
        $("#stylebot-css").html(CSSUtils.crunchCSS(this.rules, true));
    },

    toggle: function() {
        // if stylebot is open, don't allow user to disable styling on the page
        if (stylebot.status)
            return false;
        if (this.status) {
            this.disable();
        }
        else
            this.enable();
    }
}