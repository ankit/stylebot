/* eslint-disable no-undef */
import CssFormatter from './CssFormatter';
/* @ts-ignore: Will replace this a more modern CSS parser */
import JSCSSPImporter from './JSCSSPImporter';

/**
 * Utility methods for CSS generation and injection.
 */
const CSSUtils = {
  /*  e.g. of rules object used as input / output:

  rules = {
    'a.someclass': {
      'color': '#fff',
      'font-size': '12px'
    }
  }
  */
  getCSS: (
    rules: any,
    setImportant: boolean,
    expandImport: boolean,
    callback: (css: string) => void
  ) => {
    const formatter = new CssFormatter(setImportant, true);
    formatter.format(rules, expandImport, (css: string) => {
      callback(css);
    });
  },

  getFormattedCSS: (
    rules: any,
    setImportant: boolean,
    expandImport: boolean,
    callback: (css: string) => void
  ) => {
    const formatter = new CssFormatter(setImportant, false);
    formatter.format(rules, expandImport, callback);
  },

  getCSSForSelector: (
    rules: any,
    selector: string,
    setImportant: boolean,
    formatted: boolean
  ) => {
    if (rules[selector]) {
      const formatter = new CssFormatter(setImportant, !formatted);
      return formatter.formatProperties(rules[selector], false);
    } else {
      return '';
    }
  },

  getCSSForProperty: (
    property: string,
    value: string,
    setImportant: boolean
  ) => {
    const formatter = new CssFormatter(setImportant, false);
    return formatter.formatProperty(property, value, false);
  },

  injectCSSIntoDocument: (css: string, elementId: string) => {
    const el = document.getElementById(elementId);

    if (el) {
      el.innerHTML = css;
      return;
    }

    const style = document.createElement('style');

    style.type = 'text/css';
    style.setAttribute('id', elementId);
    style.appendChild(document.createTextNode(css));

    document.documentElement.appendChild(style);
  },

  removeCSSFromDocument: (elementId: string) => {
    const el = document.getElementById(elementId);

    if (el) {
      el.innerHTML = '';
    }
  },

  // parser object is that returned by JSCSSP
  getRulesFromParserObject: (sheet: any) => {
    const importer = new JSCSSPImporter();
    return importer.importSheet(sheet);
  },

  // parser object is that returned by JSCSSP
  getRuleFromParserObject: (sheet: any) => {
    const rule: any = {};
    const len = sheet.cssRules[0].declarations.length;

    for (let i = 0; i < len; i++) {
      const property = sheet.cssRules[0].declarations[i].property;
      const value = sheet.cssRules[0].declarations[i].valueText;

      rule[property] = value;
    }

    return rule;
  },
};

export default CSSUtils;
