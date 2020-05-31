/* eslint-disable no-undef */
/**
 * Utility methods for CSS generation and injection.
 */
var CSSUtils = {
  /*  e.g. of rules object used as input / output:

  rules = {
    'a.someclass': {
      'color': '#fff',
      'font-size': '12px'
    }
  }
  */
  crunchCSS: function(rules, setImportant, expandImport, callback) {
    var formatter = new cssFormatter(setImportant, true);
    formatter.format(rules, expandImport, function(css) {
      callback(css);
    });
  },

  crunchFormattedCSS: function(rules, setImportant, expandImport, callback) {
    var formatter = new cssFormatter(setImportant, false);
    formatter.format(rules, expandImport, callback);
  },

  crunchCSSForSelector: function(rules, selector, setImportant, formatted) {
    if (rules[selector]) {
      var formatter = new cssFormatter(setImportant, !formatted);
      return formatter.formatProperties(rules[selector]);
    } else {
      return '';
    }
  },

  crunchCSSForDeclaration: function(property, value, setImportant) {
    var formatter = new cssFormatter(setImportant, false);
    return formatter.formatDeclaration(property, value);
  },

  injectCSS: function(css, id) {
    if (document.getElementById(id)) {
      document.getElementById(id).innerHTML = css;
      return;
    }

    const style = document.createElement('style');

    style.type = 'text/css';
    style.setAttribute('id', id);
    style.appendChild(document.createTextNode(css));

    document.documentElement.appendChild(style);
  },

  removeCSS: function(id) {
    const el = document.getElementById(id);
    el.innerHTML = '';
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
};
