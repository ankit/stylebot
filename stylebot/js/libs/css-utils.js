/**
  * Utility methods for CSS generation and injection.
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
    var formatter = new cssFormatter(setImportant, true);
    return formatter.format(rules);
  },

  crunchFormattedCSS: function(rules, setImportant) {
    var formatter = new cssFormatter(setImportant, false);
    return formatter.format(rules);
  },

  crunchCSSForSelector: function(rules, selector, setImportant, formatted) {
    if (rules[selector]) {
      var formatter = new cssFormatter(setImportant, !formatted);
      return formatter.formatProperties(rules[selector]);
    }
    else {
      return '';
    }
  },

  crunchCSSForDeclaration: function(property, value, setImportant) {
    var formatter = new cssFormatter(setImportant, false);
    return formatter.formatDeclaration(property, value);
  },

  injectCSS: function(css, id) {
    var style = document.createElement('style');
    style.type = 'text/css';
    if (id != undefined)
      style.setAttribute('id', id);
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
  }
};
