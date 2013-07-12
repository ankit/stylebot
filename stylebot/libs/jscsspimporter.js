/**
 * Transforms JSCSSP parser's generated objects into stylebot rules
 */
function JSCSSPImporter() {
  this.rules = {};

  this.AT_RULE_PREFIX = "at";
  this.COMMENT_PREFIX = "comment";
  this.AT_IMPORT_RULE_TYPE = "@import";
  this.commentIndex = 0;
}

JSCSSPImporter.prototype = {
  isError: function(rule) {
    return (rule instanceof jscsspErrorRule);
  },

  isComment: function(rule) {
    return (rule instanceof jscsspComment);
  },

  isAtRule: function(rule) {
    var types = [
      jscsspImportRule,
      jscsspKeyframesRule,
      jscsspMediaRule,
      jscsspVariablesRule,
      jscsspPageRule,
      jscsspCharsetRule,
      jscsspNamespaceRule,
      jscsspFontFaceRule
    ];

    var len = types.length;
    for (var i = 0; i < len; i++) {
      var type = types[i];
      if (rule instanceof type) {
        return true;
      }
    }

    return false;
  },

  reportError: function(rule) {
    this.rules['error'] = rule;
  },

  importAtRule: function(rule, parent) {
    var selector = this.AT_RULE_PREFIX + rule.currentLine;
    parent[selector] = new Object();
    parent[selector][this.AT_RULE_PREFIX] = true;
    parent[selector]['text'] = rule.cssText();

    var type = rule.cssText() ? rule.cssText().split(' ')[0] : "";;
    parent[selector]['type'] = type;

    if (type === this.AT_IMPORT_RULE_TYPE) {
      var url = rule.href.substring(4, rule.href.length - 1);
      if (url[0] == '"') {
        url = url.substring(1, url.length - 1);
      }
      parent[selector]['url'] = url;
    }
  },

  importComment: function(rule, parent) {
    var selector = this.COMMENT_PREFIX + this.commentIndex;
    parent[selector] = new Object();
    parent[selector][this.COMMENT_PREFIX] = rule.cssText();
    this.commentIndex++;
  },

  importStyleRule: function(rule, parent) {
    var selector = rule.mSelectorText;
    parent[selector] = new Object();
    var len = rule.declarations.length;

    for (var i = 0; i < len; i++) {
      if (this.isComment(rule.declarations[i])) {
        this.importComment(rule.declarations[i], parent[selector]);
      } else {
        var property = rule.declarations[i].property;
        var value = rule.declarations[i].valueText;
        parent[selector][property] = value;
      }
    }
  },

  importSheet: function(sheet) {
    var len = sheet.cssRules.length;
    for (var i = 0; i < len; i++) {
      if (this.isError(sheet.cssRules[i])) {
        this.reportError(sheet.cssRules[i], this.rules);
        break;
      } else if (this.isComment(sheet.cssRules[i])) {
        this.importComment(sheet.cssRules[i], this.rules);
      } else if (this.isAtRule(sheet.cssRules[i])) {
        this.importAtRule(sheet.cssRules[i], this.rules);
      } else {
        this.importStyleRule(sheet.cssRules[i], this.rules);
      }
    }

    return this.rules;
  }
};
