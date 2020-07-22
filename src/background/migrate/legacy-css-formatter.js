/* eslint-disable */
// generate formatted css from the old stylebot format
function cssFormatter(setImportant, compactCSS) {
  this.AT_RULE_PREFIX = 'at';
  this.COMMENT_PREFIX = 'comment';
  this.AT_IMPORT_RULE_TYPE = '@import';

  this.setImportant = setImportant;
  this.compactCSS = compactCSS;
  this.preserveComments = !compactCSS;

  this._indentation = '';

  if (this.compactCSS) {
    this._newLine = '';
    this._tab = '';
  } else {
    this._newLine = '\n';
    this._tab = '  ';
  }
}

cssFormatter.prototype = {
  // @public
  format: function (rules, expandImport, callback) {
    let css = '';
    const atRulePointers = {};
    let atRuleCounter = 0;

    // The callback for @rule formatter or at the end of the for loop,
    // this value is checked. If it is true, the callback is called.
    // If not, end is set to true. This insures the final css is returned.
    let end = true;

    for (const selector in rules) {
      if (rules[selector][this.COMMENT_PREFIX]) {
        css += this.formatComment(rules[selector]);
      } else if (rules[selector][this.AT_RULE_PREFIX]) {
        end = false;
        // store pointer on where to inject the @rule css
        atRulePointers[rules[selector]] = css.length;
        atRuleCounter++;

        this.formatAtRule(rules[selector], expandImport, function (
          rule,
          result
        ) {
          const pointer = atRulePointers[rule];
          let newCSS = css.substring(0, pointer);
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
        });
      } else {
        css += this.formatRule(selector, rules[selector]);
      }
    }

    if (end) {
      callback(css);
    } else {
      end = true;
    }
  },

  // @public
  formatRule: function (selector, properties, insideRule) {
    if (properties === undefined) return '';
    if (insideRule) this.saveState();
    let css = this._indentation + selector + ' {' + this._newLine;
    css += this.formatProperties(properties, true);
    css += this._indentation + '}' + this._newLine;
    if (insideRule) this.forgetState();
    else css += this._newLine;
    return css;
  },

  // @public
  formatProperties: function (properties, shouldIndent) {
    let css = '';
    for (const property in properties) {
      if (property.indexOf(this.COMMENT_PREFIX) === 0) {
        css += this.formatComment(properties[property], true);
      } else {
        css += this.formatDeclaration(
          property,
          properties[property],
          shouldIndent
        );
      }
    }
    return css;
  },

  // @public
  formatDeclaration: function (property, value, shouldIndent) {
    let setImportant = this.setImportant;
    if (this.compactCSS && value.indexOf('!important') != -1)
      setImportant = false;

    this.saveState();
    let css = '';
    if (shouldIndent) css = this._indentation;
    css += property + ': ' + value;
    css += setImportant ? ' !important;' : ';';
    css += this._newLine;
    this.forgetState();
    return css;
  },

  formatAtRule: function (rule, expandImport, callback) {
    let css;
    if (rule.type === this.AT_IMPORT_RULE_TYPE && expandImport) {
      if (rule['expanded_text']) {
        callback(rule, rule['expanded_text']);
      } else {
        chrome.extension.sendRequest(
          { name: 'fetchImportCSS', url: rule['url'] },
          function (response) {
            callback(rule, response.text);
          }
        );
      }
    } else {
      css = this._indentation + rule['text'] + this._newLine + this._newLine;
      callback(rule, css);
    }
  },

  // @private
  formatComment: function (comment, insideRule) {
    var css = '';
    if (!this.compactCSS && this.preserveComments) {
      if (insideRule) {
        this.saveState();
      }

      var css =
        this._indentation + comment[this.COMMENT_PREFIX] + this._newLine;

      if (insideRule) {
        this.forgetState();
      } else {
        css += this._newLine;
      }
    }

    return css;
  },

  // @private
  forgetState: function () {
    if (!this.compactCSS) {
      this._indentation = this._indentation.replace(this._tab, '');
    }
  },

  // @private
  saveState: function () {
    if (!this.compactCSS) {
      this._indentation += this._tab;
    }
  },
};

export default cssFormatter;
