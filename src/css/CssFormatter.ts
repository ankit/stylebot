/**
 * Generates formatted css text from stylebot rules.
 */

const AT_RULE_PREFIX = 'at';
const COMMENT_PREFIX = 'comment';
const AT_IMPORT_RULE_TYPE = '@import';

class CssFormatter {
  tab: string;
  indentation: string;
  minimizeCss: boolean;
  setImportant: boolean;

  constructor(setImportant: boolean, minimizeCss: boolean) {
    this.tab = '  ';
    this.indentation = '';
    this.minimizeCss = minimizeCss;
    this.setImportant = setImportant;
  }

  format(
    rules: any,
    expandImport: boolean,
    callback: (css: string) => void
  ): void {
    let css = '';
    let atRuleCounter = 0;
    let atRulePointers: any = {};

    // The callback for @rule formatter or at the end of the for loop,
    // this value is checked. If it is true, the callback is called.
    // If not, end is set to true. This insures the final css is returned.
    var end = true;

    for (var selector in rules) {
      if (rules[selector][COMMENT_PREFIX]) {
        css += this.formatComment(rules[selector], false);
      } else if (rules[selector][AT_RULE_PREFIX]) {
        end = false;
        // store pointer on where to inject the @rule css
        atRulePointers[rules[selector]] = css.length;
        atRuleCounter++;

        this.formatAtRule(
          rules[selector],
          expandImport,
          (rule: any, result: any) => {
            var pointer = atRulePointers[rule];
            var newCSS = css.substring(0, pointer);
            newCSS += result;
            newCSS += css.substring(pointer, css.length);
            css = newCSS;
            atRuleCounter--;

            if (atRuleCounter == 0) {
              if (end) {
                callback(css);
              } else {
                end = true;
              }
            }
          }
        );
      } else {
        css += this.formatRule(selector, rules[selector], false);
      }
    }

    if (end) {
      callback(css);
    } else {
      end = true;
    }
  }

  formatRule(selector: string, properties: any, insideRule: boolean): string {
    if (properties === undefined) {
      return '';
    }

    if (insideRule) {
      this.saveState();
    }

    let css = `
      ${this.indentation}${selector} { \n 
      ${this.formatProperties(properties, true)}${this.indentation}}\n`;

    if (insideRule) {
      this.forgetState();
    } else {
      css += '\n';
    }

    return css;
  }

  formatProperties(properties: any, shouldIndent: boolean): string {
    let css = '';

    for (const property in properties) {
      if (property.indexOf(COMMENT_PREFIX) === 0) {
        css += this.formatComment(properties[property], true);
      } else {
        css += this.formatProperty(
          property,
          properties[property],
          shouldIndent
        );
      }
    }

    return css;
  }

  formatProperty(property: string, value: string, shouldIndent: boolean) {
    let setImportant = this.setImportant;

    if (this.minimizeCss && value.indexOf('!important') !== -1) {
      setImportant = false;
    }

    this.saveState();

    let css = '';

    if (shouldIndent) {
      css = this.indentation;
    }

    css += `${property}: ${value}`;
    css += `${setImportant ? ' !important;' : ';'}\n`;

    this.forgetState();
    return css;
  }

  formatAtRule(rule: any, expandImport: boolean, callback: any) {
    let css;

    if (rule.type === AT_IMPORT_RULE_TYPE && expandImport) {
      if (rule['expanded_text']) {
        callback(rule, rule['expanded_text']);
      } else {
        chrome.extension.sendRequest(
          { name: 'fetchImportCSS', url: rule['url'] },
          response => {
            callback(rule, response.text);
          }
        );
      }
    } else {
      css = `${this.indentation}${rule['text']}\n\n`;
      callback(rule, css);
    }
  }

  formatComment(comment: any, insideRule: boolean) {
    let css = '';

    if (!this.minimizeCss) {
      if (insideRule) {
        this.saveState();
      }

      css = `${this.indentation}${comment[COMMENT_PREFIX]}\n`;

      if (insideRule) {
        this.forgetState();
      } else {
        css += '\n';
      }
    }

    return css;
  }

  forgetState() {
    if (!this.minimizeCss) {
      this.indentation = this.indentation.replace(this.tab, '');
    }
  }

  saveState() {
    if (!this.minimizeCss) {
      this.indentation += this.tab;
    }
  }
}

export default CssFormatter;
