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
    
    cache: {
        // most recently selected elements' selector
        selector: null,
        // most recently selected elements
        elements: null,
        url: document.domain,
        styleEl: null
    },
    
    // init rules from temporary variable in apply-css.js
    initialize: function() {
        if( stylebotTempRules )
            this.rules = stylebotTempRules;
        if( stylebotTempUrl )
            this.cache.url = stylebotTempUrl;
    },
    
    fillCache: function(selector) {
        if(selector != this.cache.selector)
        {
            this.cache.selector = selector;
            this.cache.elements = $(selector);
        }
    },
    
    // apply a new rule to selected elements
    apply: function(property, value) {
        if( !stylebot.style.cache.selector )
            return true;

        stylebot.style.saveRuleToCache( stylebot.style.cache.selector, property, value );

        setTimeout( function() {
            stylebot.style.applyInlineCSS( stylebot.style.cache.elements, stylebot.style.getInlineCSS( stylebot.style.cache.selector ) );
        }, 0 );

    },
    
    applyCSS: function( css ) {
        if( !stylebot.style.cache.selector )
            return true;
        stylebot.style.applyInlineCSS( stylebot.style.cache.elements, css );


        if( stylebot.style.timer ){
            clearTimeout( stylebot.style.timer );
            stylebot.style.timer = null;
        }
        stylebot.style.timer = setTimeout( function() {
            stylebot.style.saveRulesToCacheFromCSS( css );
        }, 1000 );
    },
    
    // parse CSS into rules and add them to cache
    saveRulesToCacheFromCSS: function(css) {
        if(!this.cache.selector)
            return true;
        
        // empty rules cache
        delete this.rules[this.cache.selector];
        
        var generatedRule = CSSUtils.parseCSSBlock( css );
        
        for( var property in generatedRule )
            this.saveRuleToCache( this.cache.selector, property, generatedRule[ property ] );
    },
    
    // add/update rule to CSS rules cache
    saveRuleToCache: function(selector, property, value) {
        // check if the selector already exists in the list
        var rule = this.rules[selector];
        if(rule != undefined)
        {
            if( !this.filter(property, value) )
            {
                // does a value for property already exist
                var pValue = rule[property];
                
                if(pValue != undefined)
                {
                    delete this.rules[selector][property];
                 
                    // if no properties left, remove rule as well
                    // TODO: Use something more elegant than this hack.
                    var i = null;
                    for( i in this.rules[selector])
                    { break; }
                 
                    if(!i)
                        delete this.rules[selector];
                }
            }
            else
                rule[property] = value;
        }
        else if( this.filter(property, value) )
        {
            this.rules[selector] = new Object();
            this.rules[selector][property] = value;
        }
    },
    
    // check if a property / value pair is valid for addition to rules cache
    filter: function(property, value) {
        if(value == "")
            return false;
        
        var sizeProperties = [ 'font-size', 'line-height', 'letter-spacing', 'letter-height', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-width', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width' ];
        
        if( $.inArray(property, sizeProperties) != -1)
        {
            if($.inArray(value, WidgetUI.validSizeUnits) != -1)
                return false;
        }

        return true;
    },
    
    // generate inline CSS for selector
    getInlineCSS: function(selector) {
        var rule = this.rules[selector];
        if( rule != undefined )
        {
            var css = "";
            for( var property in rule )
                css += CSSUtils.getCSSDeclaration( property, rule[property], true );

            return css;
        }
        return "";
    },
    
    // apply inline CSS to selected element(s)
    applyInlineCSS: function(el, newCustomCSS) {
        if( !el || el.length == 0 ) return false;
        
        el.each( function() {
            var existingCSS = $(this).attr( 'style' );
            var existingCustomCSS = $(this).data( "stylebot-css" );
            var newCSS;

            // if stylebot css is being applied to the element for the first time
            if( !existingCustomCSS )
            {
                // if there is any existing inline CSS, append stylebot CSS to it
                if(existingCSS != undefined)
                    newCSS = newCustomCSS + existingCSS;
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
            $(this).data( "stylebot-css", newCustomCSS );
        });
        
        // update selection box
        setTimeout( function() {
            stylebot.selectionBox.highlight( stylebot.selectedElement );
        }, 0 );
    },
    
    // clear any custom inline CSS for element(s)
    clearInlineCSS: function(el) {
        el.each( function(){
            var existingCSS = $(this).attr( 'style' );
            var existingCustomCSS = $(this).data( "stylebot-css" );
            if( existingCustomCSS && existingCSS != undefined )
            {
                var newCSS = existingCSS.replace( existingCustomCSS, '' );
                $(this).attr({
                    style: newCSS
                });
                // clear stylebot css data associated with element
                $(this).data( "stylebot-css", null );
            }
        });
    },
    
    initInlineCSS: function() {
        for( var selector in stylebot.style.rules )
            stylebot.style.applyInlineCSS( $(selector), stylebot.style.getInlineCSS(selector) );
        
        $( "style[title=stylebot-css]" ).html("");
    },
    
    // replace inline CSS with <style> element. called when stylebot is disabled
    resetInlineCSS: function() {
        this.updateStyleElement( this.rules );

        for( var selector in stylebot.style.rules )
            stylebot.style.clearInlineCSS( $(selector) );
    },
    
    removeFromStyleElement: function( selector ) {
        
        stylebot.style.applyInlineCSS( $(selector), stylebot.style.getInlineCSS(selector) );
        
        var tempRules = {};
        for(var sel in this.rules)
        {
            if(sel != selector)
                tempRules[ sel ] = this.rules[ sel ];
        }
        this.updateStyleElement( tempRules );
    },
    
    updateStyleElement: function( rules ) {
        if( !this.cache.styleEl )
            this.cache.styleEl = $( "style[title=stylebot-css]" );
        
        if( this.cache.styleEl.length != 0 )
            this.cache.styleEl.html( CSSUtils.crunchCSS( rules, true ) );
        else
        {
            CSSUtils.injectCSS( CSSUtils.crunchCSS( rules, true ), "stylebot-css");
            this.cache.styleEl = $( "style[title=stylebot-css]" );
        }
    },
    
    // get the rule for a selector
    getRule: function( selector ) {
        var rule = this.rules[ selector ];
        if(rule != undefined)
            return rule;
        else
            return null;
    },
    
    // clear any existing custom CSS for current selector
    clear: function() {
        if( this.rules[this.cache.selector] != undefined )
            delete this.rules[this.cache.selector];
        this.clearInlineCSS( this.cache.elements );
    },
    
    clearAll: function() {
        for( var selector in this.rules )
        {
            delete this.rules[selector];
            this.clearInlineCSS( $(selector) );
        }
    },
    
    // save rules for page
    save: function() {
        stylebot.chrome.save( stylebot.style.cache.url, stylebot.style.rules );
    },
    
    reset: function() {
        this.cache.selector = null;
        this.cache.elements = null;
        setTimeout(function() {
            stylebot.style.resetInlineCSS();
        }, 100);
    }
}