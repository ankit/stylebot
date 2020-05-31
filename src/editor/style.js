/* eslint-disable no-undef */
/**
 * stylebot.style
 *
 * Generating, applying and saving CSS styling rules
 */
stylebot.style = {
  AT_RULE_PREFIX: 'at',
  PAGE_STYLE_ID: 'stylebot-css',

  /*
    cache of custom CSS rules applied to elements on the current page
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
  parser: null,

  cache: {
    // last selected elements' selector
    selector: null,
    // last selected elements
    elements: null,
    // url for which styles will be saved
    url: document.domain,
  },

  /**
   * Initialize rules and url from temporary variables in apply-css.js
   */
  initialize: function() {
    _.bindAll(this);

    if (stylebotTempUrl) {
      this.cache.url = stylebotTempUrl;
      stylebotTempUrl = null;
    }

    // if domain is empty, return url
    else if (!this.cache.url || this.cache.url === '') {
      this.cache.url = location.href;
    }

    if (stylebotTempRules) {
      this.rules = stylebotTempRules;
      stylebotTempRules = null;
    }
  },

  /**
   * Update cache with selector and selected elements
   * @param {string} selector CSS selector to update cache
   */
  fillCache: function(selector) {
    if (selector !== this.cache.selector) {
      this.cache.selector = selector;

      try {
        this.cache.elements = $(selector + ':not(#stylebot, #stylebot *)');
      } catch (e) {
        this.cache.elements = null;
      }
    }
  },

  /**
   * Applies and saves CSS style to selected elements as inline css.
   *   Used by Basic Mode.
   * @param {string} property CSS property
   * @param {string} value Value for CSS property
   */
  apply: function(property, value) {
    if (!this.cache.selector || this.cache.selector === '') {
      return true;
    }

    this.savePropertyToCache(this.cache.selector, property, value);
    this.save();

    setTimeout(
      _.bind(function() {
        if (this.cache.elements && this.cache.elements.length !== 0) {
          this.refreshInlineCSS(this.cache.selector);
        } else {
          this.applyToStyleElement(this.rules);
        }

        stylebot.widget.refreshResetButtons();
      }, this),
      0
    );
  },

  /**
   * Applies and saves CSS to selected elements as inline css.
   *   Used by Advanced Mode.
   * @param {string} css CSS string to apply
   */
  applyCSS: function(css) {
    // Timer duration before applying inline css
    var duration = 0;

    if (!this.cache.selector) {
      return;
    }

    if (this.cache.elements) {
      var noOfElements = this.cache.elements.length;
      if (noOfElements >= 400) {
        duration = 400;
      } else if (noOfElements >= 200) {
        duration = 300;
      }
    }

    if (this.updateCSSTimer) {
      clearTimeout(this.updateCSSTimer);
      this.updateCSSTimer = null;
    }

    this.updateCSSTimer = setTimeout(
      _.bind(function() {
        this.saveRuleFromCSS(css, this.cache.selector);

        if (this.cache.elements && this.cache.elements.length !== 0) {
          this.applyInlineCSS(this.cache.elements, css);
        } else {
          this.applyToStyleElement(this.rules);
        }

        stylebot.widget.refreshResetButtons();
      }, this),
      duration
    );

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.timer = setTimeout(
      _.bind(function() {
        this.save();
      }, this),
      1000
    );
  },

  /**
   * Update CSS for the entire page. Used by Page Editing Mode
   * @param {string} css CSS string
   * @param {boolean} save Should CSS be saved
   * @param {Object} data Any additional data that should be sent
   *   along with the save request.
   */
  applyPageCSS: function(css, shouldSave, data) {
    var parsedRules = {};

    if (shouldSave === undefined) {
      shouldSave = true;
    }

    if (css !== '') {
      if (!this.parser) {
        this.parser = new CSSParser();
      }

      try {
        var sheet = this.parser.parse(css, false, true);
        parsedRules = CSSUtils.getRulesFromParserObject(sheet);
      } catch (e) {
        return false;
      }
    }

    if (parsedRules['error']) {
      return parsedRules['error'];
    }

    this.removeInlineCSS(this.cache.selector);
    this.applyToStyleElement(parsedRules);

    if (shouldSave) {
      this.rules = parsedRules;
      this.save(data);
    }

    return true;
  },

  /**
   * Parses CSS string into a rule and then saves the rule
   * for the given selector.
   * @param {string} css CSS String
   * @param {string} selector CSS selector
   */
  saveRuleFromCSS: function(css, selector) {
    if (!selector) {
      return;
    }

    // empty rule for selector
    delete this.rules[selector];

    if (css !== '') {
      if (!this.parser) {
        this.parser = new CSSParser();
      }

      var sheet = this.parser.parse(selector + '{' + css + '}', false, true);
      var generatedRule = CSSUtils.getRuleFromParserObject(sheet);
      this.rules[selector] = generatedRule;
    }
  },

  /**
   * Add rule to cache
   * @param {string} selector CSS selector
   * @param {property} property CSS property
   * @param {value} value Value for property
   */
  savePropertyToCache: function(selector, property, value) {
    // check if the selector already exists in the list
    var rule = this.rules[selector];

    if (rule !== undefined) {
      if (value === '') {
        // does a value for property already exist
        if (rule[property] !== undefined) {
          delete this.rules[selector][property];

          // if no properties left, remove rule as well
          // TODO: Use something more elegant than this hack.
          var i = null;
          for (i in this.rules[selector]) {
            break;
          }

          if (!i) {
            delete this.rules[selector];
          }
        }
      } else {
        rule[property] = value;
      }
    } else if (value !== '') {
      this.rules[selector] = {};
      this.rules[selector][property] = value;
    }
  },

  /**
   * Update the inline CSS of elements to match the saved rules
   * for the given selector.
   * @param {String} selector The CSS selector for which to update the inline CSS
   */
  refreshInlineCSS: function(selector) {
    var $els = $(selector),
      rule = this.rules[selector],
      css = '';

    if (rule !== undefined) {
      _.each(
        rule,
        _.bind(function(value, property) {
          if (property.indexOf('comment') === -1) {
            css += CSSUtils.crunchCSSForDeclaration(property, value, true);
          }
        }, this)
      );
    }

    this.applyInlineCSS($els, css);
  },

  /**
   * Apply inline CSS to given elements
   * @param {jQuery} $els Elements to apply the CSS
   * @param {String} css CSS to apply
   */
  applyInlineCSS: function($els, css) {
    if (!$els || $els.length === 0) {
      return false;
    }

    _.each(
      $els,
      _.bind(function(el) {
        var $el = $(el),
          currentCSS,
          currentStylebotCSS;

        currentCSS = $el.attr('style');
        currentCSS = currentCSS ? $.trim(currentCSS) : null;

        currentStylebotCSS = $el.data('stylebotCSS');
        currentStylebotCSS = currentStylebotCSS
          ? $.trim(currentStylebotCSS)
          : null;

        // If there is no existing stylebot CSS applied to the element
        if (!currentStylebotCSS) {
          // if the element has CSS of its own, append stylebot CSS to it
          if (currentCSS && currentCSS.length !== 0) {
            if (currentCSS[currentCSS.length - 1] !== ';') {
              css = currentCSS + ';' + css;
            } else {
              css = currentCSS + css;
            }
          }
        }

        // Else if the element has the css of its own, replace the
        // existing stylebot css with the new given css
        else if (currentCSS) {
          css = currentCSS.replace(currentStylebotCSS, css);
        }

        $el.attr('style', css);
        $el.data('stylebotCSS', css);
      }, this)
    );

    setTimeout(function() {
      stylebot.selectionBox.highlight(stylebot.selectedElement);
    }, 0);
  },

  /**
   * Remove inline stylebot CSS for given elements
   * @param {String} selector The CSS selector for the elements to update
   */
  removeInlineCSS: function(selector) {
    var $els = $(selector);

    if (!$els) {
      return;
    }

    _.each(
      $els,
      _.bind(function(el) {
        var $el = $(el),
          css,
          stylebotCSS;

        css = $el.attr('style');
        stylebotCSS = $el.data('stylebotCSS');

        if (css !== undefined && stylebotCSS !== undefined) {
          css = css.replace(stylebotCSS, '');
          $el.attr('style', css);
          $el.data('stylebotCSS', null);
        }
      }, this)
    );
  },

  /**
   * Remove all inline stylebot CSS and
   * update the css in stylebot <style> element
   */
  removeAllInlineCSS: function() {
    _.each(
      this.rules,
      _.bind(function(rule, selector) {
        this.removeInlineCSS(selector);
      }, this)
    );

    this.applyToStyleElement(this.rules);
  },

  /**
   * Remove any stylebot CSS for given CSS selector from <style> element
   * and apply it as inline css.
   */
  replaceAsInlineCSS: function(selector) {
    var rules = {},
      $els = $(selector);

    if (!$els || $els.length === 0) {
      return;
    }

    this.refreshInlineCSS(selector);

    _.each(
      this.rules,
      _.bind(function(value, sel) {
        if (sel !== selector) {
          rules[sel] = value;
        }
      }, this)
    );

    this.applyToStyleElement(rules);
  },

  /**
   * Update CSS in the stylebot <style> element to match the given rules
   * @param {array} rules The style rules to apply
   */
  applyToStyleElement: function(rules) {
    CSSUtils.crunchCSS(rules, true, true, css => {
      CSSUtils.injectCSS(css, this.PAGE_STYLE_ID);
    });
  },

  /**
   * Remove any CSS from the stylebot <style> element
   */
  resetStyleElement: function() {
    this.applyToStyleElement(null);
  },

  /**
   * Get the rule for the given selector
   * @param {string} selector CSS selector for which to get the rule
   */
  getRule: function(selector) {
    var rule = this.rules[selector];
    return rule !== undefined ? rule : null;
  },

  /**
   * Remove any stylebot CSS for current selection
   */
  resetSelectedElementCSS: function() {
    if (this.rules[this.cache.selector]) {
      delete this.rules[this.cache.selector];
    }

    this.removeInlineCSS(this.cache.selector);
    this.applyToStyleElement(this.rules);
    this.save();

    setTimeout(function() {
      stylebot.selectionBox.highlight(stylebot.selectedElement);
    }, 0);
  },

  /**
   * Remove all the CSS for page from cache, <style> element and inline CSS.
   */
  resetAllCSS: function(showPopover) {
    _.each(
      this.rules,
      _.bind(function(rule, selector) {
        this.removeInlineCSS(selector);
        delete this.rules[selector];
      }, this)
    );

    this.resetStyleElement();
    this.save();

    if (showPopover) {
      this.showPreviewPopover('Removed custom CSS for the page');
      this.hidePreviewPopover(true);
    }

    setTimeout(function() {
      if (stylebot.selectionBox) {
        stylebot.selectionBox.highlight(stylebot.selectedElement);
      }
    }, 0);
  },

  /**
   * Send request to background.html to save all the cached rules
   * @param {Object} data Any additional metadata to save along with the rules
   */
  save: function(data) {
    // if no rules are present, send null as value
    var rules = null;

    if (!$.isEmptyObject(this.rules)) {
      rules = this.rules;
    }

    stylebot.chrome.save(this.cache.url, rules, data);
  },

  /**
   * Clears all the inline CSS and updates the <style> element
   * Called when stylebot is closed.
   */
  clean: function() {
    this.cache.selector = null;
    this.cache.elements = null;

    setTimeout(
      _.bind(function() {
        this.removeAllInlineCSS();
      }, this),
      100
    );
  },

  /**
   * Undo last style applied
   */
  undo: function() {
    if (stylebot.undo.isEmpty()) {
      return false;
    }

    this.rules = stylebot.undo.pop();
    this.removeInlineCSS(this.cache.selector);
    this.applyToStyleElement(this.rules);
    this.save();

    stylebot.widget.open();
    stylebot.undo.refresh();

    setTimeout(function() {
      stylebot.highlight(stylebot.selectedElement);
    }, 0);
  },

  update: function(url, rules) {
    this.cache.url = url;
    this.rules = rules;

    CSSUtils.crunchCSS(this.rules, true, true, css => {
      CSSUtils.injectCSS(css, this.PAGE_STYLE_ID);
    });
  },

  /**
   * Preview the page after removing any style rules
   */
  previewReset: function() {
    this.showPreviewPopover('Preview after removing custom CSS');
    this.applyPageCSS('', false);
  },

  /**
   * Preview the specified style by applying its CSS to the page.
   * @param {String} title The title of style.
   * @param {String} desc Description for the style.
   * @param {String} author The author of the style.
   * @param {String} timeAgo Relative time string when the style was authored.
   * @param {Integer} favCount Number of times the style has been favorited
   * @param {String} css The css for the style.
   */
  preview: function(title, desc, author, timeAgo, favCount, css) {
    this.applyPageCSS(css, false);

    if (desc) {
      desc = desc.replace(/\n/g, '<br />');
    }

    this.showPreviewPopover(
      title +
        '<br>' +
        '<div id="stylebot-preview-meta">by ' +
        author +
        ' (' +
        favCount +
        ' favorites) • Last updated ' +
        timeAgo +
        '</div>' +
        '<br><div id="stylebot-preview-description">' +
        desc +
        '</div>'
    );
  },

  /**
   * Reset the preview of any style and reset to the specifed CSS.
   * @param {String} css The CSS to apply to the page.
   */
  resetPreview: function() {
    if (this.rules) {
      CSSUtils.crunchCSS(this.rules, true, true, css => {
        CSSUtils.injectCSS(css, this.PAGE_STYLE_ID);
      });
    }

    this.hidePreviewPopover();
  },

  /**
   * Show the preview popover
   * @param {String} html The content to display inside the popover
   */
  showPreviewPopover: function(html) {
    var $preview = $('#stylebot-preview');

    if ($preview.length === 0) {
      $preview = $('<div>', {
        id: 'stylebot-preview',
      });

      $('body').append($preview);
    }

    $preview
      .html(html)
      .css('left', $(window).width() / 2 - $preview.width() / 2)
      .css('top', $(window).height() - $preview.height() - 100)
      .show();
  },

  /**
   * Hide the preview popover
   * @param {Boolean} shouldFadeOut If the popover should fade out
   */
  hidePreviewPopover: function(shouldFadeOut) {
    var $preview = $('#stylebot-preview');

    if (shouldFadeOut) {
      setTimeout(
        $.proxy(function() {
          $preview.fadeOut(1000);
        }, this),
        500
      );
    } else {
      $preview.hide();
    }
  },

  /**
   * Prepend an @import rule for a web-based font to the current
   * style and save the style.
   * @param {String} url The URL of the font.
   * @param {String} css the @font-face css for the font.
   */
  prependWebFont: function(url, css) {
    var rule = {
      text: '@import url(' + url + ');',
      expanded_text: css,
      type: '@import',
      url: url,
    };

    rule[this.AT_RULE_PREFIX] = true;

    var selectorCounter = 1;
    while (this.rules.hasOwnProperty(this.AT_RULE_PREFIX + selectorCounter)) {
      selectorCounter++;
    }

    var newRules = {};
    newRules[this.AT_RULE_PREFIX + selectorCounter] = rule;

    // todo: add ordering to styling rules, this is not reliable.
    _.each(
      this.rules,
      _.bind(function(rule, selector) {
        if (
          !this.rules[selector]['text'] ||
          this.rules[selector]['text'] !== rule['text']
        ) {
          newRules[selector] = this.rules[selector];
        }
      }, this)
    );

    this.rules = newRules;
    this.removeAllInlineCSS();
    this.save();
  },
};
