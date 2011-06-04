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
        var formatter = new cssFormatter(setImportant, true, false);
        return formatter.format(rules);
    },

    crunchFormattedCSS: function(rules, setImportant) {
        var formatter = new cssFormatter(setImportant, false, true);
        return formatter.format(rules);
    },

    // generate formatted CSS for selector
    crunchCSSForSelector: function(rules, selector, setImportant, formatted) {
        var formatter = new cssFormatter(setImportant, false, true);
        return formatter.format(rules, selector);
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
        var importer = new JSCSSPImporter();
        return importer.importSheet(sheet);
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
    
}

function JSCSSPImporter() {
    this.rules = {};
    this.commentIndex = 0;
}
JSCSSPImporter.prototype = {
    /* Error reporting functions */
    reportError: function(rule) {
        this.rules['error'] = rule;
    },
    isError: function(rule) {
        return (rule instanceof jscsspErrorRule);
    },

    /* @-webkit-keyframes */
    isKeyframesRule: function(rule) {
        return (rule instanceof jscsspKeyframesRule);
    },
    importKeyframesRule: function(keyframes, parent) {
        var selector = keyframes.mSelectorText;
        parent[selector] = new Object();
        parent[selector]["__isAnimation"] = true;

        var len = keyframes.cssRules.length;
        for (var i = 0; i < len; i++) {
            /* found an error */
            if (this.isError(keyframes.cssRules[i])) {
                this.reportError(keyframes.cssRules[i], this.rules);
                break;
            }
            /* found a comment */
            else if (this.isComment(keyframes.cssRules[i])) {
                this.importComment(keyframes.cssRules[i], parent[selector]);
            }
            else {
                this.importStyleRule(keyframes.cssRules[i], parent[selector]);
            }
        }
    },

    /* comments */
    isComment: function(rule) {
        return (rule instanceof jscsspComment);
    },
    importComment: function(rule, parent) {
        var selector = "comment-#" + this.commentIndex++;
        parent[selector] = new Object();
        parent[selector]["comment"] = rule.cssText();
    },

    /* style blocks */
    importStyleRule: function(rule, parent) {
        var selector = rule.mSelectorText;
        parent[selector] = new Object();
        var len = rule.declarations.length;
        for (var i = 0; i < len; i++) {
            if (this.isComment(rule.declarations[i])) {
                this.importComment(rule.declarations[i], parent[selector]);
            }
            else {
                var property = rule.declarations[i].property;
                var value = rule.declarations[i].valueText;
                parent[selector][property] = value;
            }
        }
    },

    /* import a JSCSSP Sheet */
    importSheet: function(sheet) {
        var len = sheet.cssRules.length;
        for (var i = 0; i < len; i++) {
            /* found an error */
            if (this.isError(sheet.cssRules[i])) {
                this.reportError(sheet.cssRules[i], this.rules);
                break;
            }
            /* found a comment */
            else if (this.isComment(sheet.cssRules[i])) {
                this.importComment(sheet.cssRules[i], this.rules);
            }
            /* found keyframes animation */
            else if (this.isKeyframesRule(sheet.cssRules[i])) {
                this.importKeyframesRule(sheet.cssRules[i], this.rules);
            }
            else {
                this.importStyleRule(sheet.cssRules[i], this.rules);
            }
        }
        return this.rules;
    }
};

/**
 * CSS Formatter for Stylebot Rules Object
 */

function cssFormatter(setImportant, compactCSS, preserveComments) {
    this.setImportant = setImportant;
    this.compactCSS = compactCSS;
    this.preserveComments = preserveComments;
    this.__indentation = "";
    if (compactCSS) {
        this.__newLine = "";
        this.__tab = "";
    }
    else {
        this.__newLine = "\n";
        this.__tab = "    ";
    }
}

cssFormatter.prototype = {
    format: function(rules, selector) {
        var css = "";
        if (selector !== undefined) {
            if (rules[selector]) {
                 if (rules[selector]["comment"]) {
                     css = this.formatComment(rules[selector], true);
                 }
                 else if (rules[selector]["__isAnimation"]) {
                     css = this.formatKeyframesRule(selector, rules[selector]);
                 }
                 else {
                     css = this.formatStyleRule(selector, rules[selector]);
                 }
            }
        }
        else {
            for (var selector in rules)
            {
                if (rules[selector]["comment"]) {
                    css += this.formatComment(rules[selector]);
                }
                else if (rules[selector]["__isAnimation"]) {
                    css += this.formatKeyframesRule(selector, rules[selector]);
                }
                else {
                    css += this.formatStyleRule(selector, rules[selector]);
                }
            }
        }
        return css;
    },
    formatDeclaration: function(property, value) {
        var setImportant = this.setImportant;
        if (this.compactCSS && value.indexOf("!important") != -1)
            setImportant = false;

        this.saveState();
        var css = this.__indentation + property + ": " + value;
            css += setImportant ? " !important;" : ";";
            css += this.__newLine;
        this.forgetState();
        return css;
    },
    formatStyleRule: function(selector, properties, insideRule) {
        if (insideRule)
            this.saveState();
        var css = this.__indentation + selector + " {" + this.__newLine;
        for (var property in properties) {
            if (property.indexOf("comment-#") === 0) {
                css += this.formatComment(properties[property], true);
            }
            else {
                css += this.formatDeclaration(property, properties[property]);
            }
        }
        css += this.__indentation + "}" + this.__newLine;
        if (insideRule) {
            this.forgetState();
        }
        else {
            css += this.__newLine;
        }
        return css;
    },
    formatComment: function(comment, insideRule) {
        var css = "";
        if (!this.compactCSS && this.preserveComments) {
            if (insideRule)
                this.saveState();
            var css = this.__indentation + comment["comment"] + this.__newLine;
            if (insideRule) {
                this.forgetState();
            }
            else {
                css += this.__newLine;
            }
        }
        return css;
    },
    formatKeyframesRule: function(selector, keyframes) {
        var css = this.__indentation + selector  + " {" + this.__newLine;
        for (var keyframe in keyframes) {
            if (keyframe === "__isAnimation") continue;
            if (keyframes[keyframe]["comment"]) {
                css += this.formatComment(keyframes[keyframe], true);
            }
            else {
                css += this.formatStyleRule(keyframe, keyframes[keyframe], true);
            }
        }
        css += this.__indentation + "}" + this.__newLine + this.__newLine;
        return css;
    },
    forgetState: function() {
        if (!this.compactCSS) {
            this.__indentation = this.__indentation.replace(this.__tab, '');
        }
    },
    saveState: function() {
        if (!this.compactCSS) {
            this.__indentation += this.__tab;
        }
    }
};

