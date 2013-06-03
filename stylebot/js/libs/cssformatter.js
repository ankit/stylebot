/* Generates formatted css text from stylebot rules. */
function cssFormatter(setImportant, compactCSS) {
  this.setImportant = setImportant;
  this.compactCSS = compactCSS;
  this.preserveComments = !compactCSS;

  this._indentation = '';
  this._atRulePrefix = "@";
  this._commentPrefix = "comment";
  this._importAtRuleType = "@import";

  if (compactCSS) {
    this._newLine = '';
    this._tab = '';
  } else {
    this._newLine = '\n';
    this._tab = '    ';
  }
}

cssFormatter.prototype = {
  // @public
  format: function(rules, expandImport, callback) {
    var css = '';
    var atRulePointers = {};

    // The callback for @rule formatter or at the end of the for loop,
    // this value is checked. If it is true, the callback is called.
    // If not, end is set to true. This insures the final css is returned.
    var end = true;

    for (var selector in rules) {
      if (rules[selector][this._commentPrefix]) {
        css += this.formatComment(rules[selector]);
      } else if (rules[selector][this._atRulePrefix]) {
        end = false;
        // store pointer on where to inject the @rule css
        atRulePointers[rules[selector]] = css.length;
        this.formatAtRule(rules[selector], expandImport, function(rule, result) {
          var pointer = atRulePointers[rule];
          var newCSS = css.substring(0, pointer);
          newCSS += result;
          newCSS += css.substring(pointer, css.length);
          css = newCSS;

          if (end) {
            callback(css);
          } else {
            end = true;
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
  formatRule: function(selector, properties, insideRule) {
    if (properties === undefined)
      return '';
    if (insideRule)
      this.saveState();
    var css = this._indentation + selector + ' {' + this._newLine;
    css += this.formatProperties(properties, true);
    css += this._indentation + '}' + this._newLine;
    if (insideRule)
      this.forgetState();
    else
      css += this._newLine;
    return css;
  },

  // @public
  formatProperties: function(properties, shouldIndent) {
    var css = '';
    for (var property in properties) {
      if (property.indexOf(this._commentPrefix) === 0) {
        css += this.formatComment(properties[property], true);
      } else {
        css += this.formatDeclaration(property,
          properties[property],
          shouldIndent);
      }
    }
    return css;
  },

  // @public
  formatDeclaration: function(property, value, shouldIndent) {
    var setImportant = this.setImportant;
    if (this.compactCSS && value.indexOf('!important') != -1)
      setImportant = false;

    this.saveState();
    var css = '';
    if (shouldIndent)
      css = this._indentation;
    css += property + ': ' + value;
    css += setImportant ? ' !important;' : ';';
    css += this._newLine;
    this.forgetState();
    return css;
  },

  formatAtRule: function(rule, expandImport, callback) {
    var css;
    if (rule.type === this._importAtRuleType && expandImport) {
      chrome.extension.sendRequest({name: 'expandImportRule', url: rule.url},
        function(response) {
          callback(rule, response.text);
        });
    } else {
      css = this._indentation + rule['text'] + this._newLine + this._newLine;
      callback(rule, css);
    }
  },

  // @private
  formatComment: function(comment, insideRule) {
    var css = '';
    if (!this.compactCSS && this.preserveComments) {
      if (insideRule) {
        this.saveState();
      }

      var css = this._indentation + comment[this._commentPrefix] +
        this._newLine;

      if (insideRule) {
        this.forgetState();
      } else {
        css += this._newLine;
      }
    }

    return css;
  },

  // @private
  forgetState: function() {
    if (!this.compactCSS) {
      this._indentation = this._indentation.replace(this._tab, '');
    }
  },

  // @private
  saveState: function() {
    if (!this.compactCSS) {
      this._indentation += this._tab;
    }
  }
};
