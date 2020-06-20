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
  crunchCSS: (rules, setImportant, expandImport, callback) => {
    const formatter = new cssFormatter(setImportant, true);
    formatter.format(rules, expandImport, css => {
      callback(css);
    });
  },

  crunchFormattedCSS: (rules, setImportant, expandImport, callback) => {
    const formatter = new cssFormatter(setImportant, false);
    formatter.format(rules, expandImport, callback);
  },

  crunchCSSForSelector: (rules, selector, setImportant, formatted) => {
    if (rules[selector]) {
      const formatter = new cssFormatter(setImportant, !formatted);
      return formatter.formatProperties(rules[selector]);
    } else {
      return '';
    }
  },

  crunchCSSForDeclaration: (property, value, setImportant) => {
    const formatter = new cssFormatter(setImportant, false);
    return formatter.formatDeclaration(property, value);
  },

  injectCSS: (css, id) => {
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

  removeCSS: id => {
    const el = document.getElementById(id);
    el.innerHTML = '';
  },

  // parser object is that returned by JSCSSP
  getRulesFromParserObject: sheet => {
    const importer = new JSCSSPImporter();
    return importer.importSheet(sheet);
  },

  // parser object is that returned by JSCSSP
  getRuleFromParserObject: sheet => {
    const rule = {};
    const len = sheet.cssRules[0].declarations.length;

    for (let i = 0; i < len; i++) {
      const property = sheet.cssRules[0].declarations[i].property;
      const value = sheet.cssRules[0].declarations[i].valueText;

      rule[property] = value;
    }

    return rule;
  },
};
